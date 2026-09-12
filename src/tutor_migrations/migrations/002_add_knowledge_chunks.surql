DEFINE TABLE IF NOT EXISTS knowledge_chunk SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS source ON knowledge_chunk TYPE string;
DEFINE FIELD IF NOT EXISTS title ON knowledge_chunk TYPE string;
DEFINE FIELD IF NOT EXISTS page ON knowledge_chunk TYPE int;
DEFINE FIELD IF NOT EXISTS chunk_index ON knowledge_chunk TYPE int;
DEFINE FIELD IF NOT EXISTS content ON knowledge_chunk TYPE string;
DEFINE FIELD IF NOT EXISTS content_hash ON knowledge_chunk TYPE string;
DEFINE FIELD IF NOT EXISTS embedding_model ON knowledge_chunk TYPE string;
DEFINE FIELD IF NOT EXISTS embedding ON knowledge_chunk TYPE array<float>;
DEFINE FIELD IF NOT EXISTS created_at ON knowledge_chunk TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON knowledge_chunk TYPE datetime DEFAULT time::now();

DEFINE INDEX IF NOT EXISTS knowledge_chunk_source_idx
    ON knowledge_chunk FIELDS source, chunk_index UNIQUE;
DEFINE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw
    ON knowledge_chunk FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;
