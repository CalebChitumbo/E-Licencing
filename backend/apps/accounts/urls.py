from django.urls import path

from . import views

urlpatterns = [
    path("auth/exchange", views.AuthExchangeView.as_view()),
    path("me", views.MeView.as_view()),
]
