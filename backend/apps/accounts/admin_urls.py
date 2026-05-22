from django.urls import path

from . import views

urlpatterns = [
    path("users", views.UserListView.as_view()),
    path("users/<str:uid>/role", views.UserRoleView.as_view()),
    path("users/<str:uid>/activation", views.UserActivationView.as_view()),
]
