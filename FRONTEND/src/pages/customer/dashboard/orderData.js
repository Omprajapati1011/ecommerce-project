export const toArray = (value) => (Array.isArray(value) ? value : []);

export const extractData = (response) => response?.data?.data ?? null;

export const extractPagination = (response) => response?.data?.pagination ?? null;

export async function fetchAllUserOrders(apiClient, pageSize = 100) {
  const firstResponse = await apiClient.get(
    `/order/user-allorder?page=1&limit=${pageSize}`,
  );

  const firstBatch = toArray(extractData(firstResponse));
  const pagination = extractPagination(firstResponse);
  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);

  if (totalPages === 1) {
    return firstBatch;
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      apiClient.get(`/order/user-allorder?page=${index + 2}&limit=${pageSize}`),
    ),
  );

  return [
    ...firstBatch,
    ...remainingResponses.flatMap((response) => toArray(extractData(response))),
  ];
}
