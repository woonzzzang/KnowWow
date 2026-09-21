from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore


class TinyEmbeddings(Embeddings):
    """Small deterministic vectors for testing the local search dependency."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)

    @staticmethod
    def _embed(text: str) -> list[float]:
        return [float("도면" in text), float("자재" in text), 1.0]


def test_in_memory_vector_store_can_run_similarity_search():
    store = InMemoryVectorStore(embedding=TinyEmbeddings())
    store.add_documents(
        [
            Document(page_content="도면을 개정한 사례", metadata={"source_id": "CASE-008"}),
            Document(page_content="자재를 요청한 사례", metadata={"source_id": "CASE-014"}),
        ]
    )

    results = store.similarity_search("도면 관련 업무", k=1)

    assert results[0].metadata["source_id"] == "CASE-008"
