from fastapi import FastAPI, UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError
from fastapi.responses import StreamingResponse
from rembg import remove
from io import BytesIO
import logging

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Remove Background API!"}


@app.post("/rmbg")
async def remove_background(file: UploadFile):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG are supported.",
        )

    try:
        input_image = Image.open(file.file)
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file.")
    except Exception as e:
        logger.error(f"Error opening image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

    try:
        output_image = remove(input_image, post_process_mask=True)
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

    img_io = BytesIO()
    output_image.save(img_io, "PNG")
    img_io.seek(0)

    return StreamingResponse(
        img_io,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename={file.filename.rsplit('.', 1)[0]}_rmbg.png"
        },
    )
