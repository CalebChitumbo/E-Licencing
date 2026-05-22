from django.urls import path

from . import views

urlpatterns = [
    path("licences/<str:licence_number>", views.PublicLicenceVerifyView.as_view()),
]
