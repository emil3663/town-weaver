from fastapi import FastAPI

app = FastAPI(title="Town Weaver API")


@app.get("/")
def root():
    return {"status": "not implemented"}
