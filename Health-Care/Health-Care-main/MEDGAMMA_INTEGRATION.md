# Medgamma Model Integration

This project has been extended to delegate all diabetes predictions to an external
`medgamma` model service running on your machine. The backend no longer runs the
XGBoost model locally; instead it proxies requests to that service and stores the
returned results in the database for history and reporting.

## Configuration

You must start the Medgamma service separately and set the following environment
variable before running the Django server:

```bash
export MEDGAMMA_SERVICE_URL=http://localhost:5000   # replace with actual host:port
```

On Windows PowerShell:

```powershell
$env:MEDGAMMA_SERVICE_URL = 'http://localhost:5000'
```

If the variable is empty or the service is unreachable the API will return a
503 error with a message from `MedgammaError`.

## How the backend uses the service

- `backend/api/medgamma_client.py` contains `predict_via_medgamma()` which
  POSTs JSON to `{MEDGAMMA_SERVICE_URL}/predict/` and validates the response.
- `backend/api/views.py` (the `predict_diabetes` view) now builds a
  normalized `features` dict from the request body, sends it to the service,
  and saves the resulting prediction in the `Prediction` model.

The service is considered authoritative; **the backend does not perform any local
model inference**.

## Running the medgamma service

Since I don't know how your model is packaged, you will need to refer to your
local installation (`medAIBase/Medgamma1.5:4b`) and start it manually. Here are
typical patterns:

- If it is a Python package you might run something like:
  ```bash
  python -m medgamma.server --port 5000
  ```
- If it exposes a CLI, use the appropriate command.

After starting the service, confirm it's listening on the expected port:

```powershell
netstat -aon | Select-String "LISTEN" | Select-String "5000"
``` 

or attempt a curl:

```bash
curl http://localhost:5000/predict/ -d '{}' -H 'Content-Type:application/json'
```

## Fallbacks & Debugging

- The Django view will respond with HTTP 503 and the error message if the
  service cannot be reached, returns invalid JSON, or omits the
  `probability` field.
- You can inspect `settings.MEDGAMMA_SERVICE_URL` at runtime by importing from
  `django.conf`.

## Testing

Once the service is running and the environment variable set, use the
existing frontend or curl to POST to `/api/predict/`. The response should be
created by Medgamma and saved in the database as before.

```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H 'Content-Type: application/json' \
  -d '{"glucose": 120, "age": 45, ...}'
```

## Next steps

- If desired, add a health-check endpoint for the medgamma service and call it
  during Django startup to fail fast.
- Implement metadata verification (e.g. requiring the service to respond with
  model name/version) and update `medgamma_client.predict_via_medgamma` accordingly.
