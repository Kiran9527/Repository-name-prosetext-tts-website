from datetime import datetime, timezone
from typing import Any
from app.core.config import settings
from app.core.supabase import supabase
import uuid
from datetime import timedelta
import razorpay
from fastapi import FastAPI, Header, HTTPException,Request
import os
import os
from dotenv import load_dotenv

load_dotenv()
import secrets
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.schemas import (
    CreateOrderRequest,
    GenerateRequest,
    PaymentVerificationRequest,
)
import requests
import os
import secrets

print(
    "CLEANUP_SECRET loaded:",
    bool(os.getenv("CLEANUP_SECRET")),
    "length:",
    len(os.getenv("CLEANUP_SECRET") or "")
)
# ============================================================
# Google Cloud TTS
# ============================================================

GOOGLE_TTS_URL = os.getenv("GOOGLE_TTS_URL")
GOOGLE_TTS_SECRET = os.getenv("GOOGLE_TTS_SECRET")


def generate_google_tts(
    text: str,
    voice_name: str,
    language_code: str,
) -> bytes:
    if not GOOGLE_TTS_URL:
        raise RuntimeError(
            "GOOGLE_TTS_URL is not configured."
        )

    if not GOOGLE_TTS_SECRET:
        raise RuntimeError(
            "GOOGLE_TTS_SECRET is not configured."
        )

    response = requests.post(
        GOOGLE_TTS_URL,
        headers={
            "X-TTS-Secret": GOOGLE_TTS_SECRET,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "voice_name": voice_name,
            "language_code": language_code,
        },
        timeout=120,
    )

    if not response.ok:
        raise RuntimeError(
            f"Google Cloud TTS failed: "
            f"{response.status_code} "
            f"{response.text[:500]}"
        )

    if not response.content:
        raise RuntimeError(
            "Google Cloud TTS returned empty audio."
        )

    return response.content
# ============================================================
# App
# ============================================================

app = FastAPI(
    title="ProseText API",
    description="ProseText AI Text-to-Speech backend",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Razorpay
# ============================================================

razorpay_client = None

if settings.razorpay_key_id and settings.razorpay_key_secret:
    razorpay_client = razorpay.Client(
        auth=(
            settings.razorpay_key_id,
            settings.razorpay_key_secret,
        )
    )


# ============================================================
# Supabase Authentication
# ============================================================

def get_authenticated_user(request: Request) -> dict:
    """
    Validate the Supabase access token sent by the frontend.

    The frontend sends:
        Authorization: Bearer <supabase_access_token>

    The backend validates that token through Supabase Auth.
    """

    authorization = request.headers.get("Authorization")

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication header.",
        )

    access_token = authorization[7:].strip()

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Missing access token.",
        )

    try:
        user_response = (
            supabase.auth.get_user(access_token)
        )

        user = user_response.user

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    return {
        "id": str(user.id),
        "email": user.email,
    }

def require_supabase_admin(request: Request) -> dict:
    """
    Authenticate the Supabase user and verify that the
    user has an active admin profile.
    """

    user = get_authenticated_user(request)
    user_id = user["id"]

    try:
        result = (
            supabase
            .table("profiles")
            .select(
                "id,full_name,role,is_active,created_at"
            )
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        print("ADMIN PROFILE ERROR:", exc)

        raise HTTPException(
            status_code=500,
            detail=f"Unable to verify admin profile: {exc}"
        )

    print("========== ADMIN DEBUG ==========")
    print("Authenticated user ID:", user_id)
    print("Authenticated email:", user.get("email"))
    print("Profile query result:", result.data)
    print("=================================")

    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="Admin profile not found."
        )

    profile = result.data[0]

    print("Profile ID:", profile.get("id"))
    print("Profile name:", profile.get("full_name"))
    print("Profile role:", profile.get("role"))
    print("Profile active:", profile.get("is_active"))

    if profile.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    if profile.get("is_active") is not True:
        raise HTTPException(
            status_code=403,
            detail="Admin account is inactive."
        )

    return {
        "id": user_id,
        "email": user.get("email"),
        "profile": profile,
    }
@app.get("/admin/dashboard/stats")
def admin_dashboard_stats(
    http_request: Request,
):
    require_supabase_admin(http_request)

    try:
        # -----------------------------
        # Users
        # -----------------------------
        users_result = (
            supabase
            .table("profiles")
            .select("id", count="exact", head=True)
            .execute()
        )

        total_users = users_result.count or 0

        # -----------------------------
        # Orders
        # -----------------------------
        orders_result = (
            supabase
            .table("orders")
            .select(
                "id,amount,character_count,payment_status,"
                "audio_status,created_at"
            )
            .execute()
        )

        orders = orders_result.data or []
        # -----------------------------
        # Recent orders
        # -----------------------------
        recent_orders_result = (
            supabase
            .table("orders")
            .select(
                "id,user_id,amount,character_count,"
                "payment_status,audio_status,created_at"
            )
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        recent_orders = recent_orders_result.data or []

        total_orders = len(orders)

        # -----------------------------
        # Captured revenue
        # -----------------------------
        captured_orders = [
            order
            for order in orders
            if order.get("payment_status") == "captured"
        ]

        total_revenue = sum(
            float(order.get("amount") or 0)
            for order in captured_orders
        )

        # -----------------------------
        # TTS characters
        # -----------------------------
        total_tts_characters = sum(
            int(order.get("character_count") or 0)
            for order in captured_orders
        )

        # -----------------------------
        # Audio statistics
        # -----------------------------
        audio_result = (
            supabase
            .table("audio_files")
            .select("id,status")
            .execute()
        )

        audio_files = audio_result.data or []

        generated_audio = sum(
            1
            for audio in audio_files
            if audio.get("status") == "available"
        )

        failed_audio = sum(
            1
            for audio in audio_files
            if audio.get("status") == "failed"
        )

        expired_audio = sum(
            1
            for audio in audio_files
            if audio.get("status") in ["expired", "deleted"]
        )

        return {
            "success": True,

            "users": {
                "total": total_users,
            },

            "orders": {
                "total": total_orders,
                "captured": len(captured_orders),
                "recent": recent_orders,
            },

            "revenue": {
                "total": total_revenue,
                "currency": "INR",
            },

            "tts": {
                "characters": total_tts_characters,
            },

            "audio": {
                "generated": generated_audio,
                "failed": failed_audio,
                "expired": expired_audio,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load admin dashboard statistics: {exc}",
        )
# ============================================================
# Pricing
# ============================================================

PLANS: dict[str, dict[str, Any]] = {
    "starter": {
        "price": 29,
        "characters": 2000,
        "name": "Starter",
    },
    "creator": {
        "price": 59,
        "characters": 5000,
        "name": "Creator",
    },
    "pro": {
        "price": 99,
        "characters": 10000,
        "name": "Pro",
    },
    "long": {
        "price": 199,
        "characters": 20000,
        "name": "Long",
    },
}


# ============================================================
# Local development storage
#
# IMPORTANT:
# This is only for local testing.
# Production must use PostgreSQL + object storage.
# ============================================================

orders: dict[str, dict[str, Any]] = {}


# ============================================================
# Statistics
# ============================================================

stats: dict[str, Any] = {
    "total_orders": 0,
    "paid_orders": 0,
    "generated_orders": 0,
    "failed_generations": 0,
    "total_characters": 0,
    "total_revenue": 0,
    "total_tts_characters": 0,
}
@app.get("/admin/users")
def admin_users(http_request: Request):

    # ============================================================
    # VERIFY ADMIN
    # ============================================================

    admin = require_supabase_admin(http_request)

    print("========================================")
    print("ADMIN USERS REQUEST")
    print("Admin ID:", admin["id"])
    print("Admin Email:", admin["email"])
    print("========================================")

    try:

        # ========================================================
        # LOAD ALL APPLICATION PROFILES
        # ========================================================

        profiles_result = (
            supabase
            .table("profiles")
            .select(
                "id,full_name,role,is_active,created_at"
            )
            .order(
                "created_at",
                desc=True
            )
            .execute()
        )

        profiles = profiles_result.data or []

        print(
            "Profiles found:",
            len(profiles)
        )

        users = []

        # ========================================================
        # GET AUTH DETAILS FOR EACH PROFILE
        # ========================================================

        for profile in profiles:

            user_id = str(
                profile.get("id")
            )

            if not user_id:
                continue

            auth_user = None

            try:

                auth_response = (
                    supabase
                    .auth
                    .admin
                    .get_user_by_id(user_id)
                )

                # Current supabase-py response
                if hasattr(
                    auth_response,
                    "user"
                ):

                    auth_user = (
                        auth_response.user
                    )

                # Compatibility with response.data
                elif hasattr(
                    auth_response,
                    "data"
                ):

                    data = auth_response.data

                    if hasattr(
                        data,
                        "user"
                    ):

                        auth_user = data.user

                    elif isinstance(
                        data,
                        dict
                    ):

                        auth_user = (
                            data.get("user")
                        )

            except Exception as auth_error:

                print(
                    f"Unable to load Auth user "
                    f"{user_id}: {auth_error}"
                )

            # ====================================================
            # AUTH INFORMATION
            # ====================================================

            email = None
            email_confirmed_at = None
            last_sign_in_at = None
            metadata = {}

            if auth_user:

                email = getattr(
                    auth_user,
                    "email",
                    None
                )

                email_confirmed_at = getattr(
                    auth_user,
                    "email_confirmed_at",
                    None
                )

                last_sign_in_at = getattr(
                    auth_user,
                    "last_sign_in_at",
                    None
                )

                metadata = (
                    getattr(
                        auth_user,
                        "user_metadata",
                        {}
                    )
                    or {}
                )

            # ====================================================
            # PROFILE + AUTH DATA
            # ====================================================

            full_name = (
                profile.get("full_name")
                or metadata.get("full_name")
                or metadata.get("name")
                or "—"
            )

            role = (
                profile.get("role")
                or "user"
            )

            is_active = profile.get(
                "is_active",
                True
            )

            created_at = (
                profile.get("created_at")
            )

            # ====================================================
            # ADD USER
            # ====================================================

            users.append({

                "id": user_id,

                "email": email,

                "full_name": full_name,

                "role": role,

                "is_active": is_active,

                "created_at": created_at,

                "email_confirmed_at":
                    email_confirmed_at,

                "last_sign_in_at":
                    last_sign_in_at,

            })

        # ========================================================
        # RESPONSE
        # ========================================================

        print(
            "Users returned:",
            len(users)
        )

        return {
            "success": True,
            "total": len(users),
            "users": users,
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "ADMIN USERS ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load users: "
                f"{exc}"
            )
        )
    
# ============================================================
# Admin Orders
# ============================================================

@app.get("/admin/orders")
def admin_orders(http_request: Request):
    require_supabase_admin(http_request)

    try:
        # --------------------------------------------------------
        # Load orders
        # --------------------------------------------------------
        orders_result = (
            supabase
            .table("orders")
            .select(
                "id,user_id,voice_id,pricing_id,"
                "amount,currency,character_count,"
                "payment_status,audio_status,"
                "download_status,refund_status,"
                "generation_attempts,created_at,updated_at"
            )
            .order("created_at", desc=True)
            .execute()
        )

        orders = orders_result.data or []

        # --------------------------------------------------------
        # Load profiles
        # --------------------------------------------------------
        profiles_result = (
            supabase
            .table("profiles")
            .select(
                "id,full_name,role,is_active"
            )
            .execute()
        )

        profiles = profiles_result.data or []

        profile_map = {
            str(profile["id"]): profile
            for profile in profiles
        }

        # --------------------------------------------------------
        # Load pricing plans
        # --------------------------------------------------------
        pricing_result = (
            supabase
            .table("pricing")
            .select(
                "id,name,price,currency,"
                "included_characters,max_characters"
            )
            .execute()
        )

        pricing = pricing_result.data or []

        pricing_map = {
            str(plan["id"]): plan
            for plan in pricing
        }

        # --------------------------------------------------------
        # Build admin order response
        # --------------------------------------------------------
        result_orders = []

        for order in orders:

            user_id = str(order.get("user_id"))
            pricing_id = str(order.get("pricing_id"))

            profile = profile_map.get(user_id, {})
            plan = pricing_map.get(pricing_id, {})

            # ----------------------------------------------------
            # Get email from Supabase Auth
            # ----------------------------------------------------
            email = None

            try:
                auth_response = (
                    supabase.auth.admin.get_user_by_id(user_id)
                )

                auth_user = None

                if hasattr(auth_response, "user"):
                    auth_user = auth_response.user

                elif hasattr(auth_response, "data"):
                    data = auth_response.data

                    if hasattr(data, "user"):
                        auth_user = data.user

                    elif isinstance(data, dict):
                        auth_user = data.get("user")

                if auth_user:
                    email = getattr(
                        auth_user,
                        "email",
                        None
                    )

            except Exception as auth_error:
                print(
                    f"Unable to load email for {user_id}: "
                    f"{auth_error}"
                )

            result_orders.append({
                "id": str(order.get("id")),
                "user_id": user_id,

                "user_name": (
                    profile.get("full_name")
                    or "—"
                ),

                "user_email": email,

                "voice_id": order.get("voice_id"),

                "pricing_id": pricing_id,

                "plan_name": (
                    plan.get("name")
                    or "—"
                ),

                "amount": float(
                    order.get("amount") or 0
                ),

                "currency": (
                    order.get("currency")
                    or "INR"
                ),

                "character_count": int(
                    order.get("character_count")
                    or 0
                ),

                "payment_status": (
                    order.get("payment_status")
                    or "unknown"
                ),

                "audio_status": (
                    order.get("audio_status")
                    or "unknown"
                ),

                "download_status": (
                    order.get("download_status")
                    or "unknown"
                ),

                "refund_status": (
                    order.get("refund_status")
                    or "none"
                ),

                "generation_attempts": int(
                    order.get("generation_attempts")
                    or 0
                ),

                "created_at": order.get(
                    "created_at"
                ),

                "updated_at": order.get(
                    "updated_at"
                ),
            })

        return {
            "success": True,
            "total": len(result_orders),
            "orders": result_orders,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "ADMIN ORDERS ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to load orders: {exc}"
            ),
        )
# ============================================================
# Admin Payments
# ============================================================

@app.get("/admin/payments")
def admin_payments(http_request: Request):
    require_supabase_admin(http_request)

    try:
        # --------------------------------------------------------
        # Load payments
        # --------------------------------------------------------
        payments_result = (
            supabase
            .table("payments")
            .select(
                "id,order_id,razorpay_order_id,"
                "razorpay_payment_id,razorpay_signature,"
                "amount,currency,status,payment_method,"
                "gateway_response,created_at,updated_at"
            )
            .order("created_at", desc=True)
            .execute()
        )

        payments = payments_result.data or []

        # --------------------------------------------------------
        # Load orders
        # --------------------------------------------------------
        orders_result = (
            supabase
            .table("orders")
            .select(
                "id,user_id,pricing_id,"
                "character_count,payment_status,"
                "created_at"
            )
            .execute()
        )

        orders = orders_result.data or []

        order_map = {
            str(order["id"]): order
            for order in orders
        }

        # --------------------------------------------------------
        # Load profiles
        # --------------------------------------------------------
        profiles_result = (
            supabase
            .table("profiles")
            .select(
                "id,full_name,role,is_active"
            )
            .execute()
        )

        profiles = profiles_result.data or []

        profile_map = {
            str(profile["id"]): profile
            for profile in profiles
        }

        # --------------------------------------------------------
        # Build response
        # --------------------------------------------------------
        result_payments = []

        for payment in payments:

            order_id = str(
                payment.get("order_id")
            )

            order = order_map.get(
                order_id,
                {}
            )

            user_id = str(
                order.get("user_id")
                or ""
            )

            profile = profile_map.get(
                user_id,
                {}
            )

            email = None

            # ----------------------------------------------------
            # Get email from Supabase Auth
            # ----------------------------------------------------
            if user_id:

                try:
                    auth_response = (
                        supabase
                        .auth
                        .admin
                        .get_user_by_id(user_id)
                    )

                    auth_user = None

                    if hasattr(
                        auth_response,
                        "user"
                    ):
                        auth_user = (
                            auth_response.user
                        )

                    elif hasattr(
                        auth_response,
                        "data"
                    ):
                        data = (
                            auth_response.data
                        )

                        if hasattr(
                            data,
                            "user"
                        ):
                            auth_user = (
                                data.user
                            )

                        elif isinstance(
                            data,
                            dict
                        ):
                            auth_user = (
                                data.get("user")
                            )

                    if auth_user:
                        email = getattr(
                            auth_user,
                            "email",
                            None
                        )

                except Exception as auth_error:

                    print(
                        f"Unable to load payment "
                        f"user {user_id}: "
                        f"{auth_error}"
                    )

            result_payments.append({

                "id": str(
                    payment.get("id")
                ),

                "order_id": order_id,

                "user_id": user_id,

                "user_name": (
                    profile.get("full_name")
                    or "—"
                ),

                "user_email": email,

                "razorpay_order_id": (
                    payment.get(
                        "razorpay_order_id"
                    )
                ),

                "razorpay_payment_id": (
                    payment.get(
                        "razorpay_payment_id"
                    )
                ),

                "amount": float(
                    payment.get("amount")
                    or 0
                ),

                "currency": (
                    payment.get("currency")
                    or "INR"
                ),

                "status": (
                    payment.get("status")
                    or "unknown"
                ),

                "payment_method": (
                    payment.get(
                        "payment_method"
                    )
                    or "—"
                ),

                "character_count": int(
                    order.get(
                        "character_count"
                    )
                    or 0
                ),

                "created_at": (
                    payment.get(
                        "created_at"
                    )
                ),

                "updated_at": (
                    payment.get(
                        "updated_at"
                    )
                ),
            })

        return {
            "success": True,
            "total": len(result_payments),
            "payments": result_payments,
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "ADMIN PAYMENTS ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to load payments: "
                f"{exc}"
            ),
        )
# ============================================================
# Admin - Get Voices
# ============================================================

@app.get("/admin/voices")
def get_admin_voices(http_request: Request):
    require_supabase_admin(http_request)

    try:
        response = (
            supabase
            .table("voices")
            .select(
                "id,"
                "name,"
                "provider,"
                "provider_voice_id,"
                "language_code,"
                "language_name,"
                "category,"
                "description,"
                "is_active,"
                "is_featured,"
                "sort_order"
            )
            .order("sort_order")
            .order("name")
            .execute()
        )

        return {
            "success": True,
            "voices": response.data or [],
            "total": len(response.data or []),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load voices: {exc}",
        )
    
# ============================================================
# Admin - Sync Google Cloud Voices
# ============================================================

@app.post("/admin/voices/sync")
def sync_google_voices(http_request: Request):
    require_supabase_admin(http_request)

    if not GOOGLE_TTS_URL:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_TTS_URL is not configured.",
        )

    if not GOOGLE_TTS_SECRET:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_TTS_SECRET is not configured.",
        )

    # --------------------------------------------------------
    # Fetch complete Google Cloud voice catalog
    # --------------------------------------------------------

    try:
        response = requests.get(
            GOOGLE_TTS_URL,
            headers={
                "X-TTS-Secret": GOOGLE_TTS_SECRET,
            },
            timeout=60,
        )

        if not response.ok:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Google Cloud TTS voice API failed: "
                    f"{response.status_code} "
                    f"{response.text[:500]}"
                ),
            )

        data = response.json()

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch Google Cloud voices: {exc}",
        )

    all_voices = data.get("voices") or []

    if not all_voices:
        return {
            "success": True,
            "provider": "google",
            "total_google_voices": 0,
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
        }

    # --------------------------------------------------------
    # Load existing Google voices ONCE
    # --------------------------------------------------------

    try:
        existing_result = (
            supabase
            .table("voices")
            .select(
                "id,"
                "provider_voice_id,"
                "is_featured,"
                "sort_order"
            )
            .eq("provider", "google")
            .execute()
        )

        existing_rows = existing_result.data or []

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load existing Google voices: {exc}",
        )

    existing_map = {
        row["provider_voice_id"]: row
        for row in existing_rows
        if row.get("provider_voice_id")
    }

    # --------------------------------------------------------
    # Build bulk upsert payload
    # --------------------------------------------------------

    rows_to_upsert = []
    skipped = 0

    for index, voice in enumerate(all_voices):

        provider_voice_id = voice.get("name")

        # ----------------------------------------------------
        # Ignore missing voice IDs
        # ----------------------------------------------------

        if not provider_voice_id:
            skipped += 1
            continue

        language_codes = voice.get("language_codes") or []

        # ----------------------------------------------------
        # Ignore voices without language information
        # ----------------------------------------------------

        if not language_codes:
            skipped += 1
            continue

        language_code = language_codes[0]

        # ----------------------------------------------------
        # Reject malformed short voice IDs
        #
        # Valid:
        # en-US-Chirp3-HD-Kore
        # en-US-Neural2-F
        # en-US-Wavenet-D
        # en-US-Standard-C
        #
        # Invalid:
        # Kore
        # Achernar
        # Algenib
        # ----------------------------------------------------

        if "-" not in provider_voice_id:
            skipped += 1
            continue

        voice_parts = provider_voice_id.split("-")

        if len(voice_parts) < 3:
            skipped += 1
            continue

        # ----------------------------------------------------
        # Determine voice family for description only
        #
        # IMPORTANT:
        # The database category is NOT the voice family.
        # Allowed category values are:
        # standard / premium / ultra
        # ----------------------------------------------------

        if "Chirp3-HD" in provider_voice_id:
            voice_family = "Chirp 3 HD"

        elif "Chirp-HD" in provider_voice_id:
            voice_family = "Chirp HD"

        elif "Neural2" in provider_voice_id:
            voice_family = "Neural2"

        elif "Wavenet" in provider_voice_id:
            voice_family = "WaveNet"

        elif "Standard" in provider_voice_id:
            voice_family = "Standard"

        elif "Studio" in provider_voice_id:
            voice_family = "Studio"

        elif "Polyglot" in provider_voice_id:
            voice_family = "Polyglot"

        elif "News" in provider_voice_id:
            voice_family = "News"

        else:
            voice_family = "Google"

        # ----------------------------------------------------
        # Preserve existing admin settings
        # ----------------------------------------------------

        existing = existing_map.get(provider_voice_id)

        rows_to_upsert.append(
            {
                "name": provider_voice_id,
                "provider": "google",
                "provider_voice_id": provider_voice_id,
                "language_code": language_code,
                "language_name": language_code,

                # Database constraint allows only:
                # standard / premium / ultra
                "category": (
                    existing.get("category", "standard")
                    if existing
                    else "standard"
                ),

                "description": (
                    f"{voice_family} voice"
                ),

                "sample_file_path": None,

                "is_active": True,

                # Preserve existing featured setting
                "is_featured": (
                    existing.get("is_featured", False)
                    if existing
                    else False
                ),

                # Preserve existing sort order
                "sort_order": (
                    existing.get("sort_order", index)
                    if existing
                    else index
                ),
            }
        )

    # --------------------------------------------------------
    # ONE bulk upsert
    # --------------------------------------------------------

    if rows_to_upsert:
        try:
            (
                supabase
                .table("voices")
                .upsert(
                    rows_to_upsert,
                    on_conflict="provider,provider_voice_id",
                )
                .execute()
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Unable to sync Google voices: {exc}",
            )

    # --------------------------------------------------------
    # Count inserted vs updated
    # --------------------------------------------------------

    existing_ids = {
        row["provider_voice_id"]
        for row in existing_rows
        if row.get("provider_voice_id")
    }

    inserted = sum(
        1
        for row in rows_to_upsert
        if row["provider_voice_id"] not in existing_ids
    )

    updated = sum(
        1
        for row in rows_to_upsert
        if row["provider_voice_id"] in existing_ids
    )

    # --------------------------------------------------------
    # Return sync result
    # --------------------------------------------------------

    return {
        "success": True,
        "provider": "google",
        "total_google_voices": len(all_voices),
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
    }

# ============================================================
# Public Voice Preview
# Generates temporary preview audio.
# Nothing is stored in Supabase Storage.
# ============================================================

@app.post("/voices/{voice_id}/preview")
def preview_voice(voice_id: str):
    try:
        result = (
            supabase
            .table("voices")
            .select(
                "id,"
                "name,"
                "provider,"
                "provider_voice_id,"
                "language_code,"
                "is_active"
            )
            .eq("id", voice_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load voice: {exc}",
        )

    voices = result.data or []

    if not voices:
        raise HTTPException(
            status_code=404,
            detail="Voice not found.",
        )

    voice = voices[0]

    # Only the configured TTS provider is allowed
    # to generate previews.
    if voice.get("provider") != "google":
        raise HTTPException(
            status_code=400,
            detail="Preview is not available for this voice.",
        )

    provider_voice_id = voice.get(
        "provider_voice_id"
    )

    language_code = voice.get(
        "language_code"
    )

    if not provider_voice_id:
        raise HTTPException(
            status_code=400,
            detail="Voice provider configuration is missing.",
        )

    if not language_code:
        raise HTTPException(
            status_code=400,
            detail="Voice language configuration is missing.",
        )

    preview_text = (
        "Hello! This is a preview of this voice. "
        "You can use this voice to create natural-sounding audio."
    )

    try:
        audio_content = generate_google_tts(
            text=preview_text,
            voice_name=provider_voice_id,
            language_code=language_code,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to generate voice preview: {exc}",
        )

    return Response(
        content=audio_content,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": (
                'inline; filename="voice-preview.mp3"'
            ),
            "Cache-Control": "no-store, no-cache",
            "Pragma": "no-cache",
        },
    )
# ============================================================
# Admin Pricing
# ============================================================

@app.get("/admin/pricing")
def admin_pricing(http_request: Request):
    require_supabase_admin(http_request)

    try:
        result = (
            supabase
            .table("pricing")
            .select(
                "id,name,price,currency,"
                "included_characters,max_characters,"
                "is_active,offer_price,offer_start,offer_end"
            )
            .order("price")
            .execute()
        )

        plans = result.data or []

        return {
            "success": True,
            "total": len(plans),
            "plans": [
                {
                    "id": str(plan["id"]),
                    "name": plan.get("name"),
                    "price": float(
                        plan.get("price") or 0
                    ),
                    "currency": (
                        plan.get("currency")
                        or "INR"
                    ),
                    "included_characters": int(
                        plan.get(
                            "included_characters"
                        ) or 0
                    ),
                    "max_characters": int(
                        plan.get(
                            "max_characters"
                        ) or 0
                    ),
                    "is_active": bool(
                        plan.get(
                            "is_active"
                        )
                    ),
                    "offer_price": (
                        float(
                            plan["offer_price"]
                        )
                        if plan.get(
                            "offer_price"
                        ) is not None
                        else None
                    ),
                    "offer_start": plan.get(
                        "offer_start"
                    ),
                    "offer_end": plan.get(
                        "offer_end"
                    ),
                }
                for plan in plans
            ],
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "ADMIN PRICING ERROR:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to load pricing: "
                f"{exc}"
            ),
        )
# ============================================================
# Admin Pricing Update
# ============================================================

class AdminPricingUpdate(BaseModel):
    name: str
    price: float
    included_characters: int
    max_characters: int
    is_active: bool
    offer_price: float | None = None
    offer_start: str | None = None
    offer_end: str | None = None


@app.put("/admin/pricing/{plan_id}")
def update_admin_pricing(
    plan_id: str,
    request: AdminPricingUpdate,
    http_request: Request,
):
    require_supabase_admin(http_request)

    # --------------------------------------------------------
    # Validate plan name
    # --------------------------------------------------------

    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Plan name is required.",
        )

    # --------------------------------------------------------
    # Validate price
    # --------------------------------------------------------

    if request.price < 0:
        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative.",
        )

    # --------------------------------------------------------
    # Validate characters
    # --------------------------------------------------------

    if request.included_characters <= 0:
        raise HTTPException(
            status_code=400,
            detail="Included characters must be greater than zero.",
        )

    if request.max_characters <= 0:
        raise HTTPException(
            status_code=400,
            detail="Maximum characters must be greater than zero.",
        )

    if request.max_characters < request.included_characters:
        raise HTTPException(
            status_code=400,
            detail=(
                "Maximum characters cannot be less "
                "than included characters."
            ),
        )

    # --------------------------------------------------------
    # Validate offer price
    # --------------------------------------------------------

    if (
        request.offer_price is not None
        and request.offer_price < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Offer price cannot be negative.",
        )

    if (
        request.offer_price is not None
        and request.offer_price > request.price
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Offer price cannot be greater "
                "than the regular price."
            ),
        )

    # --------------------------------------------------------
    # Update Supabase
    # --------------------------------------------------------

    try:
        result = (
            supabase
            .table("pricing")
            .update({
                "name": name,
                "price": request.price,
                "included_characters":
                    request.included_characters,
                "max_characters":
                    request.max_characters,
                "is_active":
                    request.is_active,
                "offer_price":
                    request.offer_price,
                "offer_start":
                    request.offer_start,
                "offer_end":
                    request.offer_end,
                "updated_at":
                    utc_now().isoformat(),
            })
            .eq("id", plan_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Pricing plan not found.",
            )

        updated_plan = result.data[0]

        return {
            "success": True,
            "message": "Pricing plan updated successfully.",
            "plan": updated_plan,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "ADMIN PRICING UPDATE ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to update pricing: {exc}",
        )
# ============================================================
# Helpers
# ============================================================
def get_pricing_plans() -> list[dict[str, Any]]:
    try:
        result = (
            supabase
            .table("pricing")
            .select(
                "id,name,price,currency,"
                "included_characters,max_characters,"
                "is_active,offer_price,offer_start,offer_end"
            )
            .eq("is_active", True)
            .order("price")
            .execute()
        )

        return result.data or []

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load pricing: {exc}",
        )

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def get_plan(plan_id: str) -> dict[str, Any]:
    """
    Load an active pricing plan from Supabase.

    Supports:
    - Supabase pricing UUID
    - Old plan names such as starter/creator/pro/long
    """

    try:
        # ----------------------------------------------------
        # If the frontend sends a Supabase UUID
        # ----------------------------------------------------
        try:
            uuid.UUID(plan_id)

            result = (
                supabase
                .table("pricing")
                .select(
                    "id,name,price,currency,"
                    "included_characters,max_characters,"
                    "is_active,offer_price,offer_start,offer_end"
                )
                .eq("id", plan_id)
                .eq("is_active", True)
                .limit(1)
                .execute()
            )

        except ValueError:
            # ------------------------------------------------
            # Backward compatibility with old plan names
            # ------------------------------------------------
            result = (
                supabase
                .table("pricing")
                .select(
                    "id,name,price,currency,"
                    "included_characters,max_characters,"
                    "is_active,offer_price,offer_start,offer_end"
                )
                .ilike("name", plan_id)
                .eq("is_active", True)
                .limit(1)
                .execute()
            )

        if result.data:
            return result.data[0]

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load pricing plan: {exc}",
        )

    raise HTTPException(
        status_code=400,
        detail="Invalid or inactive pricing plan.",
    )
def calculate_plan_for_text(
    text: str,
) -> tuple[str, dict[str, Any]]:
    """
    Automatically select the smallest active pricing
    plan capable of handling the requested text.
    """

    character_count = len(text)

    try:
        result = (
            supabase
            .table("pricing")
            .select(
                "id,name,price,currency,"
                "included_characters,max_characters,"
                "is_active,offer_price,offer_start,offer_end"
            )
            .eq("is_active", True)
            .order("max_characters")
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load pricing plans: {exc}",
        )

    plans = result.data or []

    for plan in plans:
        if character_count <= plan["max_characters"]:
            return str(plan["id"]), plan

    if plans:
        maximum = max(
            plan["max_characters"]
            for plan in plans
        )
    else:
        maximum = 0

    raise HTTPException(
        status_code=400,
        detail=(
            f"Text exceeds the maximum supported length "
            f"of {maximum:,} characters."
        ),
    )


def require_admin(
    authorization: str | None,
) -> None:
    """
    Simple Basic-style admin authentication for local testing.

    Expected header:

    Authorization: Basic base64(username:password)

    Production should use stronger authentication/session handling.
    """

    if not settings.admin_username or not settings.admin_password:
        raise HTTPException(
            status_code=503,
            detail="Admin credentials are not configured.",
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Admin authentication required.",
            headers={"WWW-Authenticate": "Basic"},
        )

    if not authorization.startswith("Basic "):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin authentication.",
            headers={"WWW-Authenticate": "Basic"},
        )

    import base64

    encoded = authorization.replace("Basic ", "", 1).strip()

    try:
        decoded = base64.b64decode(encoded).decode("utf-8")
        username, password = decoded.split(":", 1)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin authentication.",
            headers={"WWW-Authenticate": "Basic"},
        )

    if (
        username != settings.admin_username
        or password != settings.admin_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials.",
            headers={"WWW-Authenticate": "Basic"},
        )


# ============================================================
# Root
# ============================================================

@app.get("/")
def root():
    return {
        "name": "ProseText API",
        "status": "running",
        "tts_provider": "Google Cloud TTS",
        "version": "1.0.0",
    }


# ============================================================
# Health
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "tts_provider": "Google Cloud TTS",
        "razorpay_configured": razorpay_client is not None,
        "google_tts_configured": bool(
            GOOGLE_TTS_URL and GOOGLE_TTS_SECRET
        ),
    }
@app.get("/test-supabase")
def test_supabase():
    try:
        result = (
            supabase
            .table("pricing")
            .select("*")
            .limit(5)
            .execute()
        )

        return {
            "success": True,
            "message": "Supabase database connection is working.",
            "rows": result.data,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase database test failed: {exc}",
        )

# ============================================================
# Pricing
# ============================================================
@app.get("/pricing")
def pricing():
    plans = get_pricing_plans()

    return {
        "success": True,
        "currency": "INR",
        "total": len(plans),
        "plans": [
            {
                "id": str(plan["id"]),
                "name": plan.get("name"),
                "price": float(plan.get("price") or 0),
                "currency": plan.get("currency") or "INR",
                "included_characters": int(
                    plan.get("included_characters") or 0
                ),
                "max_characters": int(
                    plan.get("max_characters") or 0
                ),
                "is_active": bool(
                    plan.get("is_active")
                ),
                "offer_price": (
                    float(plan["offer_price"])
                    if plan.get("offer_price") is not None
                    else None
                ),
                "offer_start": plan.get("offer_start"),
                "offer_end": plan.get("offer_end"),
            }
            for plan in plans
        ],
    }

# ============================================================
# Public Voices
# ============================================================
# ============================================================
# Public Voices
# Provider details are never exposed to customers.
# ============================================================

@app.get("/voices")
def get_public_voices():
    try:
        response = (
            supabase
            .table("voices")
            .select(
                "id,"
                "name,"
                "language_code,"
                "language_name,"
                "category,"
                "description,"
                "is_active,"
                "is_featured,"
                "sort_order"
            )
            .eq("is_active", True)
            .eq("provider", "google")
            .order("sort_order")
            .order("name")
            .execute()
        )

        voices = response.data or []

        return {
            "success": True,
            "total": len(voices),
            "voices": voices,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load voices: {exc}",
        )
# ============================================================
# Voice preview
# ============================================================

class VoicePreviewRequest(BaseModel):
    voice_id: str
    text: str = "Hello, this is a preview of this Google Cloud voice."


@app.post("/preview")
def preview_voice(request: VoicePreviewRequest):
    """
    Generate a short, temporary voice preview.

    Preview audio is returned directly to the browser and is never
    written to Supabase Storage or the audio_files table.
    """

    voice_id = request.voice_id.strip()
    preview_text = request.text.strip()

    if not voice_id:
        raise HTTPException(
            status_code=400,
            detail="Voice ID is required.",
        )

    if not preview_text:
        raise HTTPException(
            status_code=400,
            detail="Preview text cannot be empty.",
        )

    # Keep previews short so the public endpoint cannot be used for
    # unrestricted TTS generation.
    if len(preview_text) > 250:
        raise HTTPException(
            status_code=400,
            detail="Preview text cannot exceed 250 characters.",
        )

    try:
        voice_result = (
            supabase
            .table("voices")
            .select("provider_voice_id,language_code")
            .eq("provider", "google")
            .eq("is_active", True)
            .or_(
                f"id.eq.{voice_id},provider_voice_id.eq.{voice_id}"
            )
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load preview voice: {exc}",
        )

    if not voice_result.data:
        raise HTTPException(
            status_code=404,
            detail="Selected voice is not available.",
        )

    voice = voice_result.data[0]

    try:
        audio = generate_google_tts(
            text=preview_text,
            voice_name=voice["provider_voice_id"],
            language_code=voice["language_code"],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Voice preview generation failed: {exc}",
        )

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        },
    )

# ============================================================
# Create Razorpay order
# ============================================================

@app.post("/create-order")
def create_order(
    request: CreateOrderRequest,
    http_request: Request,
):
    user = get_authenticated_user(http_request)

    if not razorpay_client:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured.",
        )

    # ========================================================
    # VALIDATE TEXT
    # ========================================================

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty.",
        )

    character_count = len(text)

    if character_count > settings.max_characters:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Maximum {settings.max_characters:,} "
                f"characters allowed."
            ),
        )

    # ========================================================
    # SERVER-SIDE PRICING
    # ========================================================

    automatic_plan_id, automatic_plan = (
        calculate_plan_for_text(text)
    )

    selected_plan_id = (
        request.plan_id or automatic_plan_id
    )

    selected_plan = get_plan(selected_plan_id)

    # ========================================================
    # VERIFY CHARACTER LIMIT
    # ========================================================

    if character_count > selected_plan["max_characters"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{selected_plan['name']} supports only "
                f"{selected_plan['max_characters']:,} "
                f"characters."
            ),
        )

    # ========================================================
    # SERVER-CALCULATED PRICE
    # ========================================================

    base_price = float(selected_plan["price"])
    offer_price = selected_plan.get("offer_price")

    price = base_price

    if offer_price is not None:
        offer_price = float(offer_price)

        if 0 <= offer_price < base_price:
            price = offer_price

    currency = selected_plan["currency"]

    amount_paise = int(round(price * 100))

    # ========================================================
    # CREATE INTERNAL ORDER ID
    # ========================================================

    internal_order_id = str(uuid.uuid4())

    # ========================================================
    # VALIDATE SELECTED VOICE
    # ========================================================

    if not request.voice_id:
        raise HTTPException(
            status_code=400,
            detail="Please select a voice.",
        )

    try:
        voice_result = (
            supabase
            .table("voices")
            .select(
                "id,provider,provider_voice_id,language_code,is_active"
            )
            .eq("provider", "google")
            .eq("provider_voice_id", request.voice_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to validate selected voice: {exc}",
        )

    if not voice_result.data:
        raise HTTPException(
            status_code=400,
            detail="Selected voice is not available.",
        )

    # ========================================================
    # IMPORTANT
    #
# request.voice_id =
# Google Cloud TTS provider voice ID
    #
    # orders.voice_id =
    # Supabase voices.id UUID
    #
    # Therefore we store voices.id here.
    # ========================================================

    selected_voice = voice_result.data[0]

    selected_voice_uuid = str(
        selected_voice["id"]
    )

    selected_provider_voice_id = (
        selected_voice["provider_voice_id"]
    )

    # ========================================================
    # CREATE INTERNAL SUPABASE ORDER
    # ========================================================

    order_data = {
        "id": internal_order_id,
        "user_id": user["id"],

        # Store Supabase voice UUID
        "voice_id": selected_voice_uuid,

        "pricing_id": str(selected_plan["id"]),
        "amount": price,
        "currency": currency,
        "character_count": character_count,
        "text_content": text,

        "payment_status": "pending",
        "audio_status": "pending",
        "download_status": "not_available",
        "refund_status": "none",
        "generation_attempts": 0,
    }

    try:
        order_result = (
            supabase
            .table("orders")
            .insert(order_data)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create order: {exc}",
        )

    if not order_result.data:
        raise HTTPException(
            status_code=500,
            detail="Unable to create internal order.",
        )

    # ========================================================
    # CREATE RAZORPAY ORDER
    # ========================================================

    razorpay_order_data = {
        "amount": amount_paise,
        "currency": currency,
        "receipt": f"ProseText_{internal_order_id[:20]}",
        "notes": {
            "product": "ProseText TTS",
            "internal_order_id": internal_order_id,
            "pricing_id": str(selected_plan["id"]),
            "characters": str(character_count),

            # Keep provider voice ID in Razorpay notes
            "voice_id": selected_provider_voice_id,
        },
    }

    try:
        razorpay_order = razorpay_client.order.create(
            data=razorpay_order_data
        )

    except Exception as exc:
        # ----------------------------------------------------
        # Razorpay failed, so remove unused DB order.
        # ----------------------------------------------------

        try:
            (
                supabase
                .table("orders")
                .delete()
                .eq("id", internal_order_id)
                .execute()
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=502,
            detail=f"Unable to create payment order: {exc}",
        )

    razorpay_order_id = razorpay_order["id"]

    # ========================================================
    # SAVE PAYMENT RECORD
    # ========================================================

    payment_data = {
        "order_id": internal_order_id,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": None,
        "razorpay_signature": None,
        "amount": price,
        "currency": currency,
        "status": "created",
        "payment_method": None,
        "gateway_response": razorpay_order,
    }

    try:
        payment_result = (
            supabase
            .table("payments")
            .insert(payment_data)
            .execute()
        )

    except Exception as exc:
        # ----------------------------------------------------
        # Razorpay order exists but payment record failed.
        # Keep order for investigation.
        # ----------------------------------------------------

        raise HTTPException(
            status_code=500,
            detail=(
                "Razorpay order was created, but the payment "
                f"record could not be saved: {exc}"
            ),
        )

    if not payment_result.data:
        raise HTTPException(
            status_code=500,
            detail="Payment record could not be created.",
        )

    # ========================================================
    # LOCAL STATS
    # ========================================================

    stats["total_orders"] += 1

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "order_id": internal_order_id,
        "razorpay_order_id": razorpay_order_id,
        "amount": amount_paise,
        "currency": currency,
        "key_id": settings.razorpay_key_id,

        "plan": {
            "id": str(selected_plan["id"]),
            "name": selected_plan["name"],
            "price": price,
            "characters": selected_plan["max_characters"],
        },

        "characters": character_count,

        # Return selected provider voice for frontend/debugging
        "voice_id": selected_provider_voice_id,
    }

# ============================================================
# Verify Razorpay payment
# ============================================================
@app.post("/verify-payment")
def verify_payment(
    request: PaymentVerificationRequest,
    http_request: Request,
):
    if not razorpay_client:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured.",
        )

    # ========================================================
    # AUTHENTICATE USER
    # ========================================================

    user = get_authenticated_user(http_request)
    user_id = user["id"]

    # ========================================================
    # FIND INTERNAL ORDER IN SUPABASE
    # ========================================================

    try:
        order_result = (
            supabase
            .table("orders")
            .select(
                "id,user_id,amount,currency,payment_status,"
                "audio_status,refund_status,character_count"
            )
            .eq("id", request.order_id)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load order: {exc}",
        )

    if not order_result.data:
        raise HTTPException(
            status_code=404,
            detail="ProseText order not found.",
        )

    order = order_result.data[0]

    # ========================================================
    # VERIFY ORDER OWNERSHIP
    # ========================================================

    if str(order.get("user_id")) != str(user_id):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to verify this order.",
        )

    # ========================================================
    # FIND RAZORPAY PAYMENT RECORD
    # ========================================================

    try:
        payment_result = (
            supabase
            .table("payments")
            .select(
                "id,order_id,razorpay_order_id,"
                "razorpay_payment_id,status,amount,currency"
            )
            .eq("order_id", request.order_id)
            .eq(
                "razorpay_order_id",
                request.razorpay_order_id,
            )
            .limit(1)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load payment record: {exc}",
        )

    if not payment_result.data:
        raise HTTPException(
            status_code=404,
            detail="Razorpay payment order not found.",
        )

    payment = payment_result.data[0]

    # ========================================================
    # VERIFY PAYMENT BELONGS TO THIS ORDER
    # ========================================================

    if str(payment["order_id"]) != str(request.order_id):
        raise HTTPException(
            status_code=400,
            detail="Payment does not belong to this order.",
        )

    # ========================================================
    # VERIFY AMOUNT
    # ========================================================

    if float(payment["amount"]) != float(order["amount"]):
        raise HTTPException(
            status_code=400,
            detail="Payment amount does not match order amount.",
        )

    # ========================================================
    # PREVENT DUPLICATE VERIFICATION
    # ========================================================

    if order["payment_status"] == "captured":
        return {
            "success": True,
            "message": "Payment already verified.",
            "order_id": request.order_id,
            "payment_id": (
                payment.get("razorpay_payment_id")
                or request.razorpay_payment_id
            ),
        }

    # ========================================================
    # VERIFY RAZORPAY SIGNATURE
    # ========================================================

    try:
        razorpay_client.utility.verify_payment_signature(
            {
                "razorpay_order_id":
                    request.razorpay_order_id,
                "razorpay_payment_id":
                    request.razorpay_payment_id,
                "razorpay_signature":
                    request.razorpay_signature,
            }
        )

    except Exception:
        # Record failed verification attempt.
        try:
            (
                supabase
                .table("payments")
                .update({
                    "status": "failed",
                    "razorpay_payment_id":
                        request.razorpay_payment_id,
                    "razorpay_signature":
                        request.razorpay_signature,
                })
                .eq("id", payment["id"])
                .execute()
            )

        except Exception:
            pass

        raise HTTPException(
            status_code=400,
            detail="Payment verification failed.",
        )

    # ========================================================
    # PAYMENT VERIFIED
    # ========================================================

    try:
        (
            supabase
            .table("payments")
            .update({
                "razorpay_payment_id":
                    request.razorpay_payment_id,
                "razorpay_signature":
                    request.razorpay_signature,
                "status": "captured",
            })
            .eq("id", payment["id"])
            .execute()
        )

        (
            supabase
            .table("orders")
            .update({
                "payment_status": "captured",
            })
            .eq("id", request.order_id)
            .eq("user_id", user_id)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Payment was verified with Razorpay, "
                f"but the database could not be updated: {exc}"
            ),
        )

    # ========================================================
    # LOCAL STATS
    # ========================================================

    stats["paid_orders"] += 1
    stats["total_revenue"] += float(order["amount"])

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "success": True,
        "message": "Payment verified successfully.",
        "order_id": request.order_id,
        "payment_id": request.razorpay_payment_id,
    }
# ============================================================
# Generate audio
# ============================================================

# ============================================================
# Generate audio
# ============================================================

# ============================================================
# Generate audio
# ============================================================

@app.post("/generate")
def generate(
    request: GenerateRequest,
    http_request: Request,
):
    user = get_authenticated_user(http_request)
    user_id = user["id"]

    # ========================================================
    # LOAD ORDER
    # ========================================================

    try:
        result = (
            supabase
            .table("orders")
            .select("*")
            .eq("id", request.order_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        rows = result.data or []

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load order: {exc}",
        )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="ProseText order not found.",
        )

    order = rows[0]

    # ========================================================
    # PAYMENT CHECK
    # ========================================================

    if order["payment_status"] != "captured":
        raise HTTPException(
            status_code=402,
            detail="Payment is required before generation.",
        )

    # ========================================================
    # GET VOICE UUID FROM ORDER
    # ========================================================

    selected_voice_uuid = order.get("voice_id")

    if not selected_voice_uuid:
        raise HTTPException(
            status_code=400,
            detail="No voice was selected for this order.",
        )

    # ========================================================
    # LOAD SELECTED VOICE
    #
    # orders.voice_id contains the Supabase UUID.
    #
    # Retrieve the Google Cloud provider voice ID.
    # ========================================================

    try:
        voice_result = (
            supabase
            .table("voices")
            .select(
                "id,provider,provider_voice_id,language_code,is_active"
            )
            .eq("id", selected_voice_uuid)
            .eq("provider", "google")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load selected voice: {exc}",
        )

    if not voice_result.data:
        raise HTTPException(
            status_code=400,
            detail="The selected voice is no longer available.",
        )

    selected_provider_voice_id = (
        voice_result.data[0]["provider_voice_id"]
    )

    # ========================================================
    # AUDIO ALREADY GENERATED
    # ========================================================

    if order["audio_status"] == "ready":
        return {
            "success": True,
            "message": "Audio already generated.",
            "order_id": request.order_id,
            "download_url": f"/download/{request.order_id}",
            "characters": order["character_count"],
        }

    # ========================================================
    # PREVENT SIMULTANEOUS GENERATION
    # ========================================================

    if order["audio_status"] == "generating":
        raise HTTPException(
            status_code=409,
            detail="Audio generation is already in progress.",
        )

    # ========================================================
    # MARK GENERATION AS STARTED
    # ========================================================

    current_attempts = (
        order.get("generation_attempts") or 0
    )

    try:
        (
            supabase
            .table("orders")
            .update({
                "audio_status": "generating",
                "generation_attempts": current_attempts + 1,
            })
            .eq("id", request.order_id)
            .eq("user_id", user_id)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to update order status: {exc}",
        )

    # ========================================================
    # GENERATE SPEECH USING GOOGLE CLOUD TTS
    #
    # IMPORTANT:
    # Use provider_voice_id, NOT the Supabase UUID.
    # ========================================================

    try:
        selected_voice = voice_result.data[0]

        selected_provider_voice_id = (
            selected_voice["provider_voice_id"]
        )

        selected_language_code = (
            selected_voice["language_code"]
        )

        audio = generate_google_tts(
            text=order["text_content"],
            voice_name=selected_provider_voice_id,
            language_code=selected_language_code,
        )

    except Exception as exc:

        try:
            (
                supabase
                .table("orders")
                .update({
                    "audio_status": "failed",
                })
                .eq("id", request.order_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass

        stats["failed_generations"] += 1

        raise HTTPException(
            status_code=502,
            detail=f"Audio generation failed: {exc}",
        )

    # ========================================================
    # VALIDATE AUDIO
    # ========================================================

    if not audio:
        try:
            (
                supabase
                .table("orders")
                .update({
                    "audio_status": "failed",
                })
                .eq("id", request.order_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass

        stats["failed_generations"] += 1

        raise HTTPException(
            status_code=502,
            detail="Google Cloud TTS returned empty audio.",
        )

    # ========================================================
    # STORAGE PATH
    # ========================================================

    storage_path = (
        f"{request.order_id}/{request.order_id}.mp3"
    )

    # ========================================================
    # UPLOAD MP3 TO SUPABASE STORAGE
    # ========================================================

    try:
        supabase.storage.from_(
            "generated-audio"
        ).upload(
            storage_path,
            audio,
            {
                "content-type": "audio/mpeg",
                "upsert": "false",
            },
        )

    except Exception as exc:

        try:
            (
                supabase
                .table("orders")
                .update({
                    "audio_status": "failed",
                })
                .eq("id", request.order_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass

        stats["failed_generations"] += 1

        raise HTTPException(
            status_code=500,
            detail=f"Unable to store generated audio: {exc}",
        )

    # ========================================================
    # 5-MINUTE EXPIRY
    #
    # Timer starts after successful generation/upload.
    # ========================================================

    generated_at = utc_now()

    expires_at = (
        generated_at + timedelta(minutes=5)
    )

    # ========================================================
    # CREATE AUDIO FILE RECORD
    # ========================================================

    audio_file_id = str(uuid.uuid4())

    audio_file_data = {
        "id": audio_file_id,
        "order_id": request.order_id,
        "user_id": user_id,
        "storage_path": storage_path,
        "file_name": (
            f"ProseText-{request.order_id}.mp3"
        ),
        "mime_type": "audio/mpeg",
        "file_size": len(audio),
        "created_at": generated_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "downloaded_at": None,
        "download_count": 0,
        "status": "available",
    }

    try:
        audio_result = (
            supabase
            .table("audio_files")
            .insert(audio_file_data)
            .execute()
        )

    except Exception as exc:

        # ----------------------------------------------------
        # Remove uploaded file if DB insert fails
        # ----------------------------------------------------

        try:
            supabase.storage.from_(
                "generated-audio"
            ).remove(
                [storage_path]
            )
        except Exception:
            pass

        try:
            (
                supabase
                .table("orders")
                .update({
                    "audio_status": "failed",
                })
                .eq("id", request.order_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Unable to create audio record: {exc}",
        )

    if not audio_result.data:
        try:
            supabase.storage.from_(
                "generated-audio"
            ).remove(
                [storage_path]
            )
        except Exception:
            pass

        try:
            (
                supabase
                .table("orders")
                .update({
                    "audio_status": "failed",
                })
                .eq("id", request.order_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="Audio record could not be created.",
        )

    # ========================================================
    # UPDATE ORDER
    # ========================================================

    try:
        order_update = (
            supabase
            .table("orders")
            .update({
                "audio_status": "ready",
                "download_status": "available",
            })
            .eq("id", request.order_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not order_update.data:
            raise Exception(
                "Order status was not updated."
            )

    except Exception as exc:

        # ----------------------------------------------------
        # Keep generated audio available for recovery,
        # but report the order update problem.
        # ----------------------------------------------------

        raise HTTPException(
            status_code=500,
            detail=(
                "Audio was generated successfully, "
                f"but order update failed: {exc}"
            ),
        )

    # ========================================================
    # STATISTICS
    # ========================================================

    stats["generated_orders"] += 1

    stats["total_characters"] += (
        order["character_count"]
    )

    stats["total_tts_characters"] += (
        order["character_count"]
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "success": True,
        "message": "Audio generated successfully.",
        "order_id": request.order_id,
        "download_url": f"/download/{request.order_id}",
        "characters": order["character_count"],
        "expires_at": expires_at.isoformat(),
    }
# ============================================================
# Download MP3
# ============================================================
@app.get("/download/{order_id}")
def download(
    order_id: str,
    http_request: Request,
):
    user = get_authenticated_user(http_request)
    user_id = user["id"]

    # 1. Find the user's available audio file
    try:
        result = (
            supabase
            .table("audio_files")
            .select("*")
            .eq("order_id", order_id)
            .eq("user_id", user_id)
            .eq("status", "available")
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load audio file: {exc}",
        )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Audio file not found or no longer available.",
        )

    audio = result.data[0]

    # 2. Check expiry
    expires_at = audio.get("expires_at")

    if expires_at:
        try:
            expiry = datetime.fromisoformat(
                str(expires_at).replace("Z", "+00:00")
            )

            if expiry <= utc_now():
                (
                    supabase
                    .table("audio_files")
                    .update({"status": "expired"})
                    .eq("id", audio["id"])
                    .eq("user_id", user_id)
                    .execute()
                )

                (
                    supabase
                    .table("orders")
                    .update({
                        "audio_status": "expired",
                        "download_status": "expired",
                    })
                    .eq("id", order_id)
                    .eq("user_id", user_id)
                    .execute()
                )

                raise HTTPException(
                    status_code=410,
                    detail="This audio download has expired.",
                )

        except HTTPException:
            raise
        except Exception:
            pass

    # 3. Generate a short-lived signed URL
    try:
        signed_result = supabase.storage.from_(
            "generated-audio"
        ).create_signed_url(
            audio["storage_path"],
            300,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create download link: {exc}",
        )

    signed_url = None

    if isinstance(signed_result, dict):
        signed_url = (
            signed_result.get("signedURL")
            or signed_result.get("signedUrl")
            or signed_result.get("signed_url")
        )

    if not signed_url:
        raise HTTPException(
            status_code=500,
            detail="Unable to create secure download link.",
        )

    # 4. Return the signed URL.
    #
    # IMPORTANT:
    # Do not delete the storage object here. The browser still needs
    # to download it. The frontend calls /download-complete after the
    # signed URL has been fetched successfully. The 5-minute cleanup
    # remains the fallback if the completion call never arrives.
    return {
        "success": True,
        "order_id": order_id,
        "download_url": signed_url,
        "expires_in": 300,
        "file_name": audio.get("file_name") or "ProseText-audio.mp3",
    }


@app.post("/download-complete/{order_id}")
def download_complete(
    order_id: str,
    http_request: Request,
):
    """
    Finalize a successful browser download.

    The frontend must call this endpoint only after it has successfully
    fetched the signed MP3 URL and received the audio bytes. The storage
    object is then deleted immediately and the database records are
    marked as deleted/downloaded.
    """

    user = get_authenticated_user(http_request)
    user_id = user["id"]

    try:
        result = (
            supabase
            .table("audio_files")
            .select("*")
            .eq("order_id", order_id)
            .eq("user_id", user_id)
            .in_("status", ["available", "expired"])
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load audio file: {exc}",
        )

    if not result.data:
        # Idempotent: if a previous completion already deleted the file,
        # the requested outcome has already been achieved.
        return {
            "success": True,
            "message": "Download already completed or audio is unavailable.",
            "already_completed": True,
        }

    audio = result.data[0]
    storage_path = audio.get("storage_path")
    audio_file_id = audio.get("id")

    # Do not allow completion after the 5-minute retention window.
    expires_at = audio.get("expires_at")
    if expires_at:
        try:
            expiry = datetime.fromisoformat(
                str(expires_at).replace("Z", "+00:00")
            )
            if expiry <= utc_now():
                try:
                    if storage_path:
                        supabase.storage.from_("generated-audio").remove(
                            [storage_path]
                        )
                finally:
                    (
                        supabase
                        .table("audio_files")
                        .update({"status": "expired"})
                        .eq("id", audio_file_id)
                        .eq("user_id", user_id)
                        .execute()
                    )

                raise HTTPException(
                    status_code=410,
                    detail="This audio download has expired.",
                )
        except HTTPException:
            raise
        except Exception:
            # If expiry parsing fails, continue with the normal deletion
            # path rather than blocking an otherwise valid completion.
            pass

    # Delete the MP3 immediately after the frontend confirms it received
    # the bytes. Storage deletion is the source-of-truth action here.
    if storage_path:
        try:
            supabase.storage.from_("generated-audio").remove(
                [storage_path]
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Unable to delete downloaded audio: {exc}",
            )

    current_count = int(audio.get("download_count") or 0)

    try:
        (
            supabase
            .table("audio_files")
            .update({
                "status": "deleted",
                "downloaded_at": utc_now().isoformat(),
                "download_count": current_count + 1,
            })
            .eq("id", audio_file_id)
            .eq("user_id", user_id)
            .execute()
        )

        (
            supabase
            .table("orders")
            .update({
                "audio_status": "deleted",
                "download_status": "downloaded",
            })
            .eq("id", order_id)
            .eq("user_id", user_id)
            .execute()
        )

        (
            supabase
            .table("downloads")
            .insert({
                "order_id": order_id,
                "user_id": user_id,
            })
            .execute()
        )
    except Exception as exc:
        # Storage has already been deleted. Keep the endpoint successful
        # because the user's file has been consumed; report the DB issue
        # only in server logs for later reconciliation.
        print(
            f"Download completion DB update failed for order {order_id}: {exc}"
        )

    return {
        "success": True,
        "message": "Download completed and audio deleted.",
        "order_id": order_id,
    }
def cleanup_expired_audio():
    """
    Delete expired generated audio files from Supabase Storage
    and update their database status.
    """

    now = datetime.now(timezone.utc)

    try:
        # Find expired/available audio files whose expiry time has passed
        result = (
            supabase.table("audio_files")
            .select("*")
            .in_("status", ["available", "expired"])
            .lt("expires_at", now.isoformat())
            .limit(100)
            .execute()
        )

        expired_files = result.data or []

    except Exception as e:
        print(f"Cleanup: unable to find expired audio files: {e}")
        return {
            "success": False,
            "deleted": 0,
            "error": str(e),
        }

    deleted_count = 0

    for audio_file in expired_files:

        audio_file_id = audio_file["id"]
        order_id = audio_file["order_id"]
        storage_path = audio_file["storage_path"]

        try:
            # 1. Delete MP3 from Supabase Storage
            supabase.storage.from_("generated-audio").remove(
                [storage_path]
            )

            # 2. Mark audio file as deleted
            (
                supabase.table("audio_files")
                .update({
                    "status": "deleted"
                })
                .eq("id", audio_file_id)
                .execute()
            )

            # 3. Mark order as deleted
            (
                supabase.table("orders")
                .update({
                    "audio_status": "deleted",
                    "download_status": "expired"
                })
                .eq("id", order_id)
                .execute()
            )

            deleted_count += 1

            print(
                f"Cleanup: deleted audio "
                f"{audio_file_id} for order {order_id}"
            )

        except Exception as e:
            print(
                f"Cleanup: failed for audio "
                f"{audio_file_id}: {e}"
            )

    return {
        "success": True,
        "deleted": deleted_count,
        "checked": len(expired_files),
    }
@app.post("/admin/cleanup-expired-audio")
def run_cleanup_expired_audio(
    x_cleanup_secret: str | None = Header(default=None)
):
    # Get cleanup secret from environment
    cleanup_secret = settings.cleanup_secret

    # Make sure the server has a secret configured
    if not cleanup_secret:
        raise HTTPException(
            status_code=500,
            detail="Cleanup secret is not configured.",
        )

    # Check the secret supplied by the caller
    if not x_cleanup_secret:
        raise HTTPException(
            status_code=401,
            detail="Cleanup authentication required.",
        )

    if not secrets.compare_digest(
        x_cleanup_secret,
        cleanup_secret,
    ):
        raise HTTPException(
            status_code=403,
            detail="Invalid cleanup secret.",
        )

    # Run cleanup
    result = cleanup_expired_audio()

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result["error"],
        )

    return result
# ============================================================
# Admin statistics
# ============================================================

@app.get("/admin/stats")
def admin_stats(
    authorization: str | None = Header(default=None),
):
    require_admin(authorization)

    total_orders = stats["total_orders"]
    paid_orders = stats["paid_orders"]
    generated_orders = stats["generated_orders"]

    conversion_rate = 0

    if paid_orders > 0:
        conversion_rate = round(
            generated_orders / paid_orders * 100,
            2,
        )

    return {
        "success": True,
        "stats": {
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "generated_orders": generated_orders,
            "failed_generations": stats[
                "failed_generations"
            ],
            "total_characters": stats[
                "total_characters"
            ],
            "total_tts_characters": stats[
                "total_tts_characters"
            ],
            "total_revenue_inr": stats[
                "total_revenue"
            ],
            "generation_success_rate": conversion_rate,
        },
        "plans": {
            plan_id: {
                "name": plan["name"],
                "price_inr": plan["price"],
                "characters": plan["characters"],
            }
            for plan_id, plan in PLANS.items()
        },
    }