from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def healthz(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("healthz", healthz),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.facilities.urls")),
    path("api/v1/", include("apps.applications.urls")),
    path("api/v1/", include("apps.workflow.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.licences.urls")),
    path("api/v1/", include("apps.documents.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.audit.urls")),
    path("api/v1/admin/", include("apps.accounts.admin_urls")),
    path("api/v1/public/", include("apps.public.urls")),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
