from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, DataSourceViewSet, ESGRecordViewSet, AuditLogViewSet, IngestionViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'data-sources', DataSourceViewSet)
router.register(r'esg-records', ESGRecordViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ingest/upload/', IngestionViewSet.as_view({'post': 'upload'}), name='ingest-upload'),
]
