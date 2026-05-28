from django.db import models
from django.contrib.auth.models import User

class Company(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class DataSource(models.Model):
    SOURCE_TYPES = [
        ('SAP', 'SAP ERP'),
        ('UTILITY', 'Utility Portal'),
        ('CONCUR', 'Concur Travel'),
    ]
    name = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='data_sources')
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.source_type})"

class ESGRecord(models.Model):
    SCOPE_CHOICES = [
        ('SCOPE_1', 'Scope 1 (Direct Emissions)'),
        ('SCOPE_2', 'Scope 2 (Indirect - Owned)'),
        ('SCOPE_3', 'Scope 3 (Indirect - Value Chain)'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('FLAGGED', 'Flagged for Issue'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='esg_records')
    source = models.ForeignKey(DataSource, on_delete=models.SET_NULL, null=True, related_name='esg_records')
    
    # Original data exactly as ingested
    original_data = models.JSONField(default=dict)
    
    # Normalized fields
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    category = models.CharField(max_length=100) # e.g. "Electricity", "Flights", "Fuel"
    
    # Standardized activity/consumption
    normalized_value = models.FloatField(null=True, blank=True)
    normalized_unit = models.CharField(max_length=50, null=True, blank=True)
    
    # Computed emissions (simplified for prototype)
    emissions_kgco2e = models.FloatField(null=True, blank=True)
    
    # Temporal context
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    
    # Analyst Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    # Audit trail timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Record {self.id} - {self.category} ({self.status})"

class AuditLog(models.Model):
    record = models.ForeignKey(ESGRecord, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255) # e.g., "Created", "Status changed to Approved", "Value edited"
    previous_state = models.JSONField(null=True, blank=True)
    new_state = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log for Record {self.record.id} - {self.action}"
