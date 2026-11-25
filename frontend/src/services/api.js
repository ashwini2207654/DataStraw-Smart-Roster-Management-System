
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchDashboardData() {
  try {
    const endpoints = [
      "employees",
      "brands",
      "pods",
      "processes"
    ];

    const responses = await Promise.all(
      endpoints.map((endpoint) =>
        fetch(`${API_BASE_URL}/${endpoint}`)
      )
    );

    if (responses.some((response) => !response.ok)) {
      throw new Error("Failed to fetch dashboard data");
    }

    const data = await Promise.all(
      responses.map((response) => response.json())
    );

    return {
      employees: data[0].total,
      brands: data[1].total,
      pods: data[2].total,
      processes: data[3].total
    };

  } catch (error) {
    console.error("Dashboard API Error:", error);
    throw error;
  }
}
