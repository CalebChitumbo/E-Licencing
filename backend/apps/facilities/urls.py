from django.urls import path

from . import views

urlpatterns = [
    path("facilities", views.FacilityListCreateView.as_view()),
    path("facilities/search", views.StaffFacilitySearchView.as_view()),
    path("facilities/<str:facility_id>", views.FacilityDetailView.as_view()),
    path("facilities/<str:facility_id>/sources", views.SourceListCreateView.as_view()),
]
