from django.urls import path

from . import views

urlpatterns = [
    path("applications/<str:app_id>/licence", views.LicenceGenerateView.as_view()),
    path("licences/<str:licence_number>", views.LicenceDetailView.as_view()),
    path("licences/<str:licence_number>/download", views.LicenceDownloadView.as_view()),
    path("licences/<str:licence_number>/revoke", views.LicenceRevokeView.as_view()),
]
