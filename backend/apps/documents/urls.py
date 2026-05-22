from django.urls import path

from . import views

urlpatterns = [
    path("applications/<str:app_id>/documents", views.DocumentListView.as_view()),
    path("applications/<str:app_id>/documents/intent", views.DocumentUploadIntentView.as_view()),
    path(
        "applications/<str:app_id>/documents/<str:doc_id>/download",
        views.DocumentDownloadView.as_view(),
    ),
]
