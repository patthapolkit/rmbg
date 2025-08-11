import io
import sys
import types
from pathlib import Path

# Ensure backend module is importable
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Provide a lightweight stub for rembg to avoid heavy dependency during tests
if 'rembg' not in sys.modules:
    sys.modules['rembg'] = types.SimpleNamespace(remove=lambda img, post_process_mask=True: img)

from fastapi.testclient import TestClient
from PIL import Image

from main import app

client = TestClient(app)

def _create_image_bytes(fmt: str) -> bytes:
    """Create an in-memory image and return its byte content."""
    img = Image.new("RGB", (1, 1), color="red")
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_upload_valid_png():
    image_bytes = _create_image_bytes("PNG")
    files = {"file": ("test.png", image_bytes, "image/png")}
    response = client.post("/rmbg", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"


def test_upload_gif_rejected():
    image_bytes = _create_image_bytes("GIF")
    files = {"file": ("test.gif", image_bytes, "image/gif")}
    response = client.post("/rmbg", files=files)
    assert response.status_code == 400
    assert response.json() == {
        "detail": "Invalid file type. Only JPEG and PNG are supported."
    }
