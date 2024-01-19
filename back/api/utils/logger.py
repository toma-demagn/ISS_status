import logging
def get_logger(name):
    # Create a logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Create a stream handler
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)

    # Create a logging format
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(handler)

    return logger

def log(func):
    logger = get_logger(func.__name__)
    def wrapper(*args, **kwargs):
        logger.info(f'{func.__name__} is called')
        return func(*args, **kwargs)
    return wrapper
