from django.urls import path

from . import views

urlpatterns = [
    path("invoices", views.InvoiceListView.as_view()),
    path("invoices/<str:invoice_id>", views.InvoiceDetailView.as_view()),
    path("invoices/<str:invoice_id>/proof", views.InvoiceProofView.as_view()),
    path("invoices/<str:invoice_id>/verify", views.InvoiceVerifyView.as_view()),
    path("admin/config/fees", views.FeeScheduleView.as_view()),
]
