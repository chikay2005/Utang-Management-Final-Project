const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  } catch {
    throw new Error("Cannot reach the backend. Make sure the backend terminal is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  dashboard: () => request("/dashboard"),
  customers: () => request("/customers"),
  addCustomer: (body) => request("/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),
  debts: () => request("/debts"),
  addDebt: (body) => request("/debts", { method: "POST", body: JSON.stringify(body) }),
  payments: () => request("/payments"),
  addPayment: (body) => request("/payments", { method: "POST", body: JSON.stringify(body) }),
  history: () => request("/history")
};
