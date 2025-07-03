import objc
from Foundation import NSObject, NSRunLoop, NSDate
from LocalAuthentication import LAContext

def authenticate_with_touch_id():
    context = LAContext.alloc().init()
    success_ptr = objc.nil
    error_ptr = objc.nil

    if not context.canEvaluatePolicy_error_(1, None):
        return {"success": False, "error": "Touch ID not available"}

    result = {"done": False, "success": False}

    def reply(success, error):
        result["success"] = bool(success)
        result["done"] = True

    context.evaluatePolicy_localizedReason_reply_(1, "unlock your diary.", reply)

    # Block until result["done"] becomes True
    run_loop = NSRunLoop.currentRunLoop()
    while not result["done"]:
        run_loop.runUntilDate_(NSDate.dateWithTimeIntervalSinceNow_(0.1))

    return {"success": result["success"], "error": None if result["success"] else "Authentication failed"}