"""Base Django settings for RPA-IRMS."""
from __future__ import annotations

import os
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["*"]),
    DJANGO_CORS_ALLOWED_ORIGINS=(list, []),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-insecure-secret-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

# Django installed apps — we deliberately omit auth/sessions/admin/contenttypes
# because all auth + persistence runs through Firebase + Firestore.
INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "apps.accounts.apps.AccountsConfig",
    "apps.facilities.apps.FacilitiesConfig",
    "apps.applications.apps.ApplicationsConfig",
    "apps.workflow.apps.WorkflowConfig",
    "apps.payments.apps.PaymentsConfig",
    "apps.licences.apps.LicencesConfig",
    "apps.documents.apps.DocumentsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.audit.apps.AuditConfig",
    "apps.public.apps.PublicConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "irms.middleware.RequestLogMiddleware",
]

ROOT_URLCONF = "irms.urls"
WSGI_APPLICATION = "irms.wsgi.application"
ASGI_APPLICATION = "irms.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": False,
        "OPTIONS": {"context_processors": []},
    },
]

# Django requires a database to be configured even though we don't use the ORM.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

LANGUAGE_CODE = "en-zm"
TIME_ZONE = "Africa/Lusaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["irms.firebase_auth.FirebaseAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "irms.pagination.DefaultPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "300/minute",
        "public_verify": "60/minute",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "irms.exceptions.api_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "RPA-IRMS API",
    "DESCRIPTION": "Integrated Regulatory Information Management System",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# CORS
CORS_ALLOWED_ORIGINS = env.list("DJANGO_CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# Firebase / GCP
FIREBASE_PROJECT_ID = env("FIREBASE_PROJECT_ID", default="")
FIREBASE_STORAGE_BUCKET = env("FIREBASE_STORAGE_BUCKET", default="")
FIREBASE_AUTH_EMULATOR_HOST = env("FIREBASE_AUTH_EMULATOR_HOST", default="")
FIRESTORE_EMULATOR_HOST = env("FIRESTORE_EMULATOR_HOST", default="")
FIREBASE_STORAGE_EMULATOR_HOST = env("FIREBASE_STORAGE_EMULATOR_HOST", default="")

# Email
SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")
EMAIL_FROM = env("EMAIL_FROM", default="noreply@rpa.gov.zm")

# SMS (Phase 2 wiring; stubbed for MVP)
AT_USERNAME = env("AT_USERNAME", default="")
AT_API_KEY = env("AT_API_KEY", default="")
AT_SENDER_ID = env("AT_SENDER_ID", default="RPA")

# Public verify
PUBLIC_VERIFY_URL = env("PUBLIC_VERIFY_URL", default="https://elicensing.rpa.gov.zm/verify")

# Workflow defaults (also editable at runtime via /admin/config/workflow)
DEFAULT_SLA_BUSINESS_DAYS = 5

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"plain": {"format": "%(levelname)s %(name)s %(message)s"}},
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.db.backends": {"level": "WARNING"},
        "irms": {"level": "INFO", "propagate": True},
    },
}

if os.environ.get("FIRESTORE_EMULATOR_HOST"):
    os.environ.setdefault("GOOGLE_CLOUD_PROJECT", FIREBASE_PROJECT_ID or "rpa-irms-dev")
