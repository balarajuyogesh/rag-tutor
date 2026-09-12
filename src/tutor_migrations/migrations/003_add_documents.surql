DEFINE TABLE IF NOT EXISTS document SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS source ON document TYPE string;
DEFINE FIELD IF NOT EXISTS title ON document TYPE string;
DEFINE FIELD IF NOT EXISTS content_hash ON document TYPE string;
DEFINE FIELD IF NOT EXISTS page_count ON document TYPE int;
DEFINE FIELD IF NOT EXISTS chunks_stored ON document TYPE int;
DEFINE FIELD IF NOT EXISTS size_bytes ON document TYPE int;
DEFINE FIELD IF NOT EXISTS created_at ON document TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON document TYPE datetime DEFAULT time::now() VALUE time::now();

DEFINE INDEX IF NOT EXISTS document_content_hash_idx
    ON document FIELDS content_hash UNIQUE;
DEFINE INDEX IF NOT EXISTS document_source_idx
    ON document FIELDS source;

DEFINE FIELD IF NOT EXISTS document ON knowledge_chunk TYPE option<record<document>>;
DEFINE INDEX IF NOT EXISTS knowledge_chunk_document_idx
    ON knowledge_chunk FIELDS document;
