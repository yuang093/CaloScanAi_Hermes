"""
CaloScanAi — 自訂 HTTP 例外類別
"""

from fastapi import HTTPException, status


class CaloScanException(HTTPException):
    """基底例外類別"""
    def __init__(self, detail: str, error_code: str = "CALOSCAN_ERROR"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": detail, "error_code": error_code}
        )


class NotFoundException(CaloScanException):
    """404 資源不存在"""
    def __init__(self, detail: str = "資源不存在"):
        super().__init__(detail=detail, error_code="NOT_FOUND")


class UnauthorizedException(CaloScanException):
    """401 未授權"""
    def __init__(self, detail: str = "未授權"):
        super().__init__(detail=detail, error_code="UNAUTHORIZED")


class BadRequestException(CaloScanException):
    """400 錯誤請求"""
    def __init__(self, detail: str = "請求格式錯誤"):
        super().__init__(detail=detail, error_code="BAD_REQUEST")


class BarcodeNotFoundException(CaloScanException):
    """條碼查詢不到"""
    def __init__(self, barcode: str):
        super().__init__(
            detail=f"條碼 {barcode} 不在資料庫中",
            error_code="BARCODE_NOT_FOUND"
        )


class ExternalAPIException(CaloScanException):
    """外部 API（OpenFoodFacts 等）錯誤"""
    def __init__(self, detail: str = "外部服務暫時無法使用"):
        super().__init__(detail=detail, error_code="EXTERNAL_API_ERROR")