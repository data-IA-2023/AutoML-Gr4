from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('upload/', views.upload_csv, name='upload_csv'),
    path('view/<int:pk>/', views.view_csv, name='view_csv'),
    path('delete/<int:pk>/', views.delete_csv, name='delete_csv'),
    path('clean/<int:pk>/', views.clean_data, name='clean_data'),
    path('column/<int:pk>/', views.column_operation, name='column_operation'),
    path('delete-row/<int:pk>/', views.delete_row, name='delete_row'),
    path('export/csv/<int:pk>/', views.export_csv, name='export_csv'),
    path('export/excel/<int:pk>/', views.export_excel, name='export_excel'),
    path('export/json/<int:pk>/', views.export_json, name='export_json'),
    
   
]
