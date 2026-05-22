from django.urls import path

from . import views

urlpatterns = [
    path("applications", views.ApplicationListCreateView.as_view()),
    path("applications/<str:app_id>", views.ApplicationDetailView.as_view()),
    path("applications/<str:app_id>/wizard", views.ApplicationWizardView.as_view()),
    path("applications/<str:app_id>/submit", views.ApplicationSubmitView.as_view()),
    path("applications/<str:app_id>/transition", views.ApplicationTransitionView.as_view()),
    path("applications/<str:app_id>/audit", views.ApplicationAuditView.as_view()),
    path("queue", views.StaffQueueView.as_view()),
]
