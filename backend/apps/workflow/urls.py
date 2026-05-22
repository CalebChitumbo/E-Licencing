from django.urls import path

from . import views

urlpatterns = [path("workflow/config", views.WorkflowConfigView.as_view())]
