import io
import math
import struct
import wave


def generate_demo_wav(text: str) -> bytes:
    """
    Generate a simple WAV audio file for testing.

    This is NOT real text-to-speech.
    It creates a short tone whose duration depends
    on the amount of text.
    """

    sample_rate = 22050

    # Keep demo audio reasonably short.
    duration = min(
        max(1.0, len(text) * 0.02),
        10.0,
    )

    frequency = 440.0

    total_samples = int(
        sample_rate * duration
    )

    audio = io.BytesIO()

    with wave.open(audio, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)

        frames = bytearray()

        for i in range(total_samples):
            sample = math.sin(
                2 * math.pi * frequency * i / sample_rate
            )

            value = int(
                sample * 16000
            )

            frames.extend(
                struct.pack("<h", value)
            )

        wav.writeframes(frames)

    return audio.getvalue()