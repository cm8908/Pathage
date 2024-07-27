import traceback
from flask import jsonify
from werkzeug.exceptions import HTTPException, default_exceptions, InternalServerError

class CustomError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)
        
# TODO: Custom error handling https://velog.io/@chyoon0512/Flask-error-handler
def JsonApp(app):
    def error_handling(error):
        if isinstance(error, HTTPException):  # HTTP Exeption의 경우
            result = {
                'status': 'error',
                'code': error.code,
                'description': error.description,
                'message': str(error)
            }
        elif isinstance(error, CustomError):
            result = {
                'status': 'error',
                'code': 500,
                'message': str(error)
            }
        else:
            description = InternalServerError().description # 나머지 Exception의 경우
            result = {
                'status': 'error',
                'code': 500,
                'description': description,
                'message': '500 Internal server error'
            }
            app.logger.error(error)
            app.logger.error(traceback.format_exc())
        resp = jsonify(result)
        resp.status_code = result['code']
        return resp
        
    for code in default_exceptions: # 에러 핸들러 등록 
        app.register_error_handler(code, error_handling)
    app.register_error_handler(Exception, error_handling)

    return app
