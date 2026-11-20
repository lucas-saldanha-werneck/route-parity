// EXAMPLE DATA, invented for this demo. Not from any real company.
package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/api/contacts", listContacts)
	r.Post("/api/contacts", createContact)
	r.Get("/api/contacts/{id}", getContact)
	r.Delete("/api/contacts/{id}", deleteContact)
	r.Get("/api/listings/{id}/matches", listMatches)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", health)
	mux.HandleFunc("/webhooks/crm", crmWebhook)
	_ = mux
	return r
}
