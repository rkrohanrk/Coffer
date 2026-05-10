from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import accounts, assets, auth, holdings, import_csv, performance, prices, transactions
from app.db.supabase_client import get_supabase
from app.jobs.price_fetch import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    await get_supabase()  # warm up the shared client
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Coffer API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/v1")
app.include_router(accounts.router,     prefix="/api/v1")
app.include_router(assets.router,       prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(holdings.router,     prefix="/api/v1")
app.include_router(performance.router,  prefix="/api/v1")
app.include_router(import_csv.router,   prefix="/api/v1")
app.include_router(prices.router,       prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
