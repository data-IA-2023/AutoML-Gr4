from django.db import models
from django.contrib.auth.models import User
import os
from django.utils import timezone

# Create your models here.

class CSVFile(models.Model):
    """
    Modèle pour stocker et gérer les fichiers CSV téléchargés
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Utilisateur')
    title = models.CharField(max_length=255, verbose_name='Titre')
    file = models.FileField(upload_to='csv_files/', verbose_name='Fichier')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de téléchargement')
    last_viewed = models.DateTimeField(null=True, blank=True, verbose_name='Dernière consultation')
    view_count = models.IntegerField(default=0, verbose_name='Nombre de vues')
    operations_log = models.JSONField(default=list, blank=True, verbose_name='Journal des opérations')
    rows_count = models.IntegerField(default=0, verbose_name='Nombre de lignes')
    columns_count = models.IntegerField(default=0, verbose_name='Nombre de colonnes')

    class Meta:
        verbose_name = 'Fichier CSV'
        verbose_name_plural = 'Fichiers CSV'
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title or os.path.basename(self.file.name)

    def save(self, *args, **kwargs):
        """
        Sauvegarde le fichier CSV et définit le titre s'il n'est pas spécifié
        """
        if not self.title:
            self.title = os.path.splitext(os.path.basename(self.file.name))[0]
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Supprime le fichier physique lors de la suppression de l'enregistrement
        """
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

    def log_operation(self, operation_type, details=None):
        """
        Enregistre une nouvelle opération dans le journal des opérations
        """
        if not self.operations_log:
            self.operations_log = []
        
        self.operations_log.append({
            'operation': operation_type,
            'details': details,
            'timestamp': timezone.now().isoformat()
        })
        self.save()

    def record_view(self):
        """
        Enregistre une nouvelle consultation du fichier
        """
        self.last_viewed = timezone.now()
        self.view_count += 1
        self.save()

class Operation(models.Model):
    csv_file = models.ForeignKey(CSVFile, on_delete=models.CASCADE, related_name='operations')
    operation_type = models.CharField(max_length=50)
    details = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.operation_type} on {self.csv_file.title} at {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
        
        
    

