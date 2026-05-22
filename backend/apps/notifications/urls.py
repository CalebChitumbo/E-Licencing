from django.urls import path

from . import views

urlpatterns = [
    path("notifications", views.NotificationListView.as_view()),
    path("notifications/<str:notif_id>/read", views.NotificationMarkReadView.as_view()),
]
