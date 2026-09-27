ARG API_IMAGE=movebooks-api:validation
FROM ${API_IMAGE}
# This separate image contains test-only auth/fault hooks; production image does not.
COPY tests/runtime_harness/app.py /validation/app.py
CMD ["python", "/validation/app.py"]
