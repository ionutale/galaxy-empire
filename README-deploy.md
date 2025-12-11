This folder contains files to containerize the SvelteKit app and deploy it to Google Cloud Run via Cloud Build.

Files added

- `Dockerfile` — multi-stage image that builds with pnpm and runs the SvelteKit Node adapter build output (`build/index.js`).
- `cloudbuild.yaml` — Cloud Build pipeline: build, push to Container Registry (gcr.io) and deploy to Cloud Run.
- `docker-compose.yml` — local test harness: build image and run on port 3000.
- `.dockerignore` — files to exclude from the image.

Quick local test (requires Docker):

```bash
# from the app/ folder
docker compose build --progress=plain
docker compose up
```

Build & push with gcloud (Cloud Build):

```bash
# from the repo or app/ folder
# replace SERVICE_NAME and REGION as needed
gcloud builds submit --config=app/cloudbuild.yaml --substitutions=_SERVICE_NAME=galaxy-empire-app,_REGION=us-central1
```

Notes / assumptions

- Uses Node 20 base images and `pnpm` via corepack.
- The project uses the SvelteKit Node adapter; the Dockerfile runs `node build/index.js` which is produced by `pnpm build`.
- Cloud Build will push images to Container Registry (`gcr.io/$PROJECT_ID`). Ensure the Cloud Build service account has permissions to deploy Cloud Run.
- If you prefer Artifact Registry, modify `cloudbuild.yaml` to push to your Artifact Registry repo and use that image URI in the deploy step.

Next steps

- Optionally add a `cloudbuild-trigger` in GCP to automatically run the pipeline on pushes to `main`.
- If your app needs environment variables or secrets, use Secret Manager and add a deploy step to inject them into Cloud Run or set them with `gcloud run services update`.
