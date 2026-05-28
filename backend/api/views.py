from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company, DataSource, ESGRecord, AuditLog
from .serializers import CompanySerializer, DataSourceSerializer, ESGRecordSerializer, AuditLogSerializer, FileUploadSerializer
from .services.ingestion import handle_ingestion
from rest_framework.parsers import MultiPartParser, FormParser

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class DataSourceViewSet(viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer

class ESGRecordViewSet(viewsets.ModelViewSet):
    queryset = ESGRecord.objects.all().order_by('-created_at')
    serializer_class = ESGRecordSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = ESGRecord.objects.count()
        approved = ESGRecord.objects.filter(status='APPROVED').count()
        flagged = ESGRecord.objects.filter(status='FLAGGED').count()
        return Response({
            'total': total,
            'approved': approved,
            'flagged': flagged
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        record = self.get_object()
        if record.status != 'PENDING':
            return Response({'error': 'Only pending records can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        record.status = 'APPROVED'
        record.save()
        AuditLog.objects.create(
            record=record, 
            action="Status changed to Approved",
            previous_state={'status': 'PENDING'},
            new_state={'status': 'APPROVED'}
        )
        return Response(self.get_serializer(record).data)

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        record = self.get_object()
        notes = request.data.get('notes', '')
        
        record.status = 'FLAGGED'
        record.notes = notes
        record.save()
        AuditLog.objects.create(
            record=record, 
            action="Status changed to Flagged",
            new_state={'status': 'FLAGGED', 'notes': notes}
        )
        return Response(self.get_serializer(record).data)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        record_id = self.request.query_params.get('record_id', None)
        if record_id:
            queryset = queryset.filter(record_id=record_id)
        return queryset

class IngestionViewSet(viewsets.ViewSet):
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['post'])
    def upload(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            company_id = serializer.validated_data['company_id']
            source_type = serializer.validated_data['source_type']
            
            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
                
            # Create or get source
            source, _ = DataSource.objects.get_or_create(
                company=company,
                source_type=source_type,
                defaults={'name': f"Default {source_type} Source"}
            )
            
            try:
                records = handle_ingestion(file, company, source_type, source)
                return Response({
                    "message": f"Successfully ingested {len(records)} records.",
                    "count": len(records)
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
