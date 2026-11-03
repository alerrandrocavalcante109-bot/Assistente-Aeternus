FROM libretranslate/libretranslate:latest

ENV LT_HOST=0.0.0.0 \
    LT_PORT=10000 \
    LT_LOAD_ONLY=en,es,fr,ja,ru,zh,pt \
    LT_CHAR_LIMIT=4500 \
    LT_REQ_LIMIT=15 \
    LT_THREADS=1 \
    ARGOS_CHUNK_TYPE=MINISBD

EXPOSE 10000
