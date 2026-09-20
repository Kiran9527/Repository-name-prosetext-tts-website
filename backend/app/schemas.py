from pydantic import BaseModel, Field, field_validator


MAX_TEXT_LENGTH = 50000


# ============================================================
# Create Order Request
# ============================================================

class CreateOrderRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=MAX_TEXT_LENGTH,
        description="Text to convert into speech",
    )

    plan_id: str | None = Field(
        default=None,
        description="Selected ProseText pricing plan",
    )

    voice_id: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Selected Google Cloud voice ID",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Text cannot be empty.")

        return value

    @field_validator("plan_id")
    @classmethod
    def validate_plan_id(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().lower()

        if not value:
            return None

        return value

    @field_validator("voice_id")
    @classmethod
    def validate_voice_id(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Voice ID cannot be empty.")

        return value


# ============================================================
# Generate Request
# ============================================================

class GenerateRequest(BaseModel):
    order_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="ProseText internal order ID",
    )

    @field_validator("order_id")
    @classmethod
    def validate_order_id(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Order ID cannot be empty.")

        return value


# ============================================================
# Payment Verification Request
# ============================================================

class PaymentVerificationRequest(BaseModel):
    order_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    razorpay_order_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    razorpay_payment_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    razorpay_signature: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    @field_validator(
        "order_id",
        "razorpay_order_id",
        "razorpay_payment_id",
        "razorpay_signature",
    )
    @classmethod
    def validate_payment_fields(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Payment field cannot be empty."
            )

        return value