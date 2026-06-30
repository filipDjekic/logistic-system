import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import SectionCard from "../../../shared/components/SectionCard/SectionCard";
import ErrorState from "../../../shared/components/ErrorState/ErrorState";
import DataTable from "../../../shared/components/DataTable/DataTable";
import type { DataTableColumn } from "../../../shared/types/common.types";
import {
  buildSortParam,
} from "../../../core/api/pagination";
import { EntityLookupField, type LookupOption } from "../../lookup";
import { EntityDetailsLayout } from "../../../shared/components/EntityDetails";
import { ChangeHistoryPanel } from "../../../shared/components/OperationalPanels";
import useDetailsPagination from "../../../shared/hooks/useDetailsPagination";
import { stockMovementsApi } from "../../stock-movements/api/stockMovementsApi";
import type { StockMovementResponse } from "../../stock-movements/types/stockMovement.types";
import {
  useBinInventory,
  useBinLocation,
  useInternalWarehouseMovements,
} from "../hooks/useWarehouseLocations";
import type {
  BinInventoryResponse,
  InternalWarehouseMovementResponse,
} from "../types/warehouseLocation.types";
import { warehouseLocationRoutes } from "../utils/warehouseLocationRoutes";

type TabKey =
  | "overview"
  | "bin-inventory"
  | "stock-movements"
  | "internal-movements"
  | "change-history";

function toNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function usePagedState<T = unknown>(defaultSize = 10) {
  return useDetailsPagination<T>(defaultSize);
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)}%`
    : "—";
}

export default function BinDetailsPage() {
  const {
    warehouseId: warehouseParam,
    zoneId: zoneParam,
    binId: binParam,
  } = useParams();
  const warehouseId = toNumber(warehouseParam);
  const zoneId = toNumber(zoneParam);
  const binId = toNumber(binParam);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [inventorySearch, setInventorySearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockProduct, setStockProduct] = useState<LookupOption | null>(null);
  const inventoryPage = usePagedState();
  const movementPage = usePagedState();
  const stockPage = usePagedState();

  const binQuery = useBinLocation(
    binId,
    Boolean(warehouseId && zoneId && binId),
  );
  const currentBin = binQuery.data ?? null;

  const overviewInventoryQuery = useBinInventory(
    {
      warehouseId,
      zoneId,
      binLocationId: binId,
      page: 0,
      size: 200,
      sort: buildSortParam({ field: "quantity", direction: "desc" }),
    },
    activeTab === "overview" && Boolean(warehouseId && zoneId && binId),
  );

  const inventoryQuery = useBinInventory(
    {
      warehouseId,
      zoneId,
      binLocationId: binId,
      search: inventorySearch.trim() || undefined,
      page: inventoryPage.page,
      size: inventoryPage.size,
      sort: buildSortParam({ field: "productName", direction: "asc" }),
    },
    activeTab === "bin-inventory" && Boolean(warehouseId && zoneId && binId),
  );

  const stockMovementsQuery = useQuery({
    queryKey: [
      "stock-movements",
      "bin-details",
      warehouseId,
      binId,
      stockSearch,
      stockProduct?.id,
      stockPage.page,
      stockPage.size,
    ],
    queryFn: () =>
      stockMovementsApi.getAll({
        warehouseId: warehouseId ?? "ALL",
        productId: stockProduct?.id ?? "ALL",
        binLocationId: binId ?? "ALL",
        search: stockSearch,
        page: stockPage.page,
        size: stockPage.size,
        sort: "createdAt,desc",
      }),
    enabled: activeTab === "stock-movements" && Boolean(warehouseId && binId),
    staleTime: 20_000,
  });

  const movementsQuery = useInternalWarehouseMovements(
    {
      warehouseId,
      binLocationId: binId,
      search: movementSearch.trim() || undefined,
      page: movementPage.page,
      size: movementPage.size,
      sort: "createdAt,desc",
    },
    activeTab === "internal-movements" && Boolean(warehouseId && binId),
  );

  const overviewMovementsQuery = useInternalWarehouseMovements(
    {
      warehouseId,
      binLocationId: binId,
      page: 0,
      size: 5,
      sort: "createdAt,desc",
    },
    activeTab === "overview" && Boolean(warehouseId && binId),
  );

  const overviewInventoryRows = overviewInventoryQuery.data?.content ?? [];
  const totalProducts = overviewInventoryQuery.data?.totalElements ?? 0;
  const totalQuantity = overviewInventoryRows.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0,
  );
  const capacity = currentBin?.capacity ?? null;
  const occupancy =
    capacity && capacity > 0 ? (totalQuantity / capacity) * 100 : null;

  const inventoryColumns: DataTableColumn<BinInventoryResponse>[] = [
    {
      id: "product",
      header: "Product",
      render: (row) => `${row.productName} (${row.sku})`,
    },
    {
      id: "quantity",
      header: "Quantity",
      align: "right",
      render: (row) => <Typography fontWeight={800}>{row.quantity}</Typography>,
    },
    { id: "zone", header: "Zone", render: (row) => row.zoneCode },
    {
      id: "updated",
      header: "Updated",
      render: (row) => formatDate(row.lastUpdated),
    },
  ];

  const stockMovementColumns: DataTableColumn<StockMovementResponse>[] = [
    {
      id: "id",
      header: "Movement",
      render: (row) => (
        <Button
          size="small"
          component={RouterLink}
          to={warehouseLocationRoutes.stockMovementDetails(row.id)}
        >
          #{row.id}
        </Button>
      ),
    },
    {
      id: "type",
      header: "Type",
      render: (row) => <Chip size="small" label={row.movementType} />,
    },
    {
      id: "product",
      header: "Product",
      render: (row) => (
        <Button
          size="small"
          component={RouterLink}
          to={warehouseLocationRoutes.productDetails(row.productId)}
        >
          {row.productName}
        </Button>
      ),
    },
    {
      id: "binTrace",
      header: "Bin trace",
      render: (row) => (
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700}>
            {row.sourceBinCode || row.destinationBinCode
              ? `${row.sourceBinCode ?? "—"} → ${row.destinationBinCode ?? "—"}`
              : "—"}
          </Typography>
          {row.sourceBinId === binId || row.destinationBinId === binId ? (
            <Chip size="small" label="Selected bin" />
          ) : null}
        </Stack>
      ),
    },
    {
      id: "quantity",
      header: "Quantity",
      align: "right",
      render: (row) => row.quantity,
    },
    {
      id: "beforeAfter",
      header: "Before → after",
      render: (row) => `${row.quantityBefore} → ${row.quantityAfter}`,
    },
    {
      id: "createdAt",
      header: "Created",
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const movementColumns: DataTableColumn<InternalWarehouseMovementResponse>[] =
    [
      {
        id: "product",
        header: "Product",
        render: (row) => `${row.productName} (${row.sku})`,
      },
      {
        id: "trace",
        header: "Trace",
        render: (row) => (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Button
              size="small"
              component={RouterLink}
              to={warehouseLocationRoutes.binDetails(
                row.warehouseId,
                row.sourceBinZoneId,
                row.sourceBinId,
              )}
            >
              {row.sourceBinCode}
            </Button>
            <Typography variant="body2" color="text.secondary">
              →
            </Typography>
            <Button
              size="small"
              component={RouterLink}
              to={warehouseLocationRoutes.binDetails(
                row.warehouseId,
                row.destinationBinZoneId,
                row.destinationBinId,
              )}
            >
              {row.destinationBinCode}
            </Button>
          </Stack>
        ),
      },
      {
        id: "quantity",
        header: "Quantity",
        align: "right",
        render: (row) => row.quantity,
      },
      {
        id: "status",
        header: "Status",
        render: (row) => <Chip size="small" label={row.status} />,
      },
      {
        id: "createdAt",
        header: "Created",
        render: (row) => formatDate(row.createdAt),
      },
    ];

  const tabs: { value: TabKey; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "bin-inventory", label: "Bin inventory" },
    { value: "stock-movements", label: "Stock movements" },
    { value: "internal-movements", label: "Movement trace" },
    { value: "change-history", label: "Change history" },
  ];

  if (!warehouseId || !zoneId || !binId) {
    return <ErrorState title="Invalid bin route" description="The warehouse, zone or bin ID in the route is not valid." />;
  }

  return (
    <EntityDetailsLayout
      overline="Warehouse bin"
      title={
        currentBin ? `${currentBin.code} · ${currentBin.name}` : `Bin #${binId}`
      }
      description={
        currentBin
          ? `${currentBin.warehouseName} / ${currentBin.zoneCode}`
          : undefined
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TabKey)}
      loading={binQuery.isLoading}
      loadingText="Loading bin details..."
      error={binQuery.isError ? binQuery.error : null}
      errorTitle="Bin could not be loaded"
      onRetry={() => void binQuery.refetch()}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            component={RouterLink}
            to={warehouseLocationRoutes.warehouseLocationDetails(
              warehouseId,
              zoneId,
            )}
            variant="outlined"
          >
            Back to location
          </Button>
        </Stack>
      }
    >
      {activeTab === "overview" ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            {[
              ["Products", formatNumber(totalProducts)],
              ["Quantity", formatNumber(totalQuantity)],
              ["Capacity", formatNumber(capacity)],
              ["Occupancy", formatPercent(occupancy)],
            ].map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                <SectionCard title={label}>
                  <Typography variant="h5" fontWeight={900}>
                    {value}
                  </Typography>
                </SectionCard>
              </Grid>
            ))}
          </Grid>

          <SectionCard
            title="Bin profile"
            description="Operational attributes for this bin."
          >
            <Grid container spacing={2}>
              {[
                ["Warehouse", currentBin?.warehouseName ?? `#${warehouseId}`],
                [
                  "Zone",
                  currentBin
                    ? `${currentBin.zoneCode} · ${currentBin.zoneName}`
                    : `#${zoneId}`,
                ],
                ["Code", currentBin?.code ?? `#${binId}`],
                ["Label", currentBin?.name ?? "—"],
                ["Zone type", currentBin?.zoneType ?? "—"],
                ["Status", currentBin?.active ? "ACTIVE" : "INACTIVE"],
                ["Description", currentBin?.description ?? "—"],
                ["Created", formatDate(currentBin?.createdAt)],
                ["Updated", formatDate(currentBin?.updatedAt)],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, md: 4 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={800}
                  >
                    {label}
                  </Typography>
                  <Typography fontWeight={700}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </SectionCard>

          <SectionCard
            title="Bin inventory"
            description="Current product placement in this bin. Open the Bin inventory tab for search and pagination."
          >
            <DataTable
              columns={inventoryColumns}
              rows={overviewInventoryRows.slice(0, 8)}
              getRowId={(row) => `${row.binLocationId}-${row.productId}`}
              loading={overviewInventoryQuery.isLoading}
              error={overviewInventoryQuery.isError}
              onRetry={() => overviewInventoryQuery.refetch()}
            />
          </SectionCard>

          <SectionCard
            title="Movement trace"
            description="Latest internal movements where this bin was source or destination."
          >
            {overviewMovementsQuery.data?.content?.length ? (
              <DataTable
                columns={movementColumns}
                rows={overviewMovementsQuery.data.content}
                getRowId={(row) => row.id}
                loading={overviewMovementsQuery.isLoading}
                error={overviewMovementsQuery.isError}
                onRetry={() => overviewMovementsQuery.refetch()}
              />
            ) : (
              <Box py={2}>
                <Typography color="text.secondary">
                  No recent internal movements for this bin.
                </Typography>
              </Box>
            )}
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === "bin-inventory" ? (
        <SectionCard
          title="Bin inventory"
          description="Central inventory view for this bin."
        >
          <Stack spacing={2}>
            <TextField
              label="Search product/name/SKU"
              value={inventorySearch}
              onChange={(event) => {
                setInventorySearch(event.target.value);
                inventoryPage.reset();
              }}
              size="small"
              fullWidth
            />
            <DataTable
              columns={inventoryColumns}
              rows={inventoryQuery.data?.content ?? []}
              getRowId={(row) => `${row.binLocationId}-${row.productId}`}
              loading={inventoryQuery.isLoading}
              error={inventoryQuery.isError}
              onRetry={() => inventoryQuery.refetch()}
              pagination={inventoryPage.pagination(inventoryQuery.data, inventoryQuery.isFetching)}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === "stock-movements" ? (
        <SectionCard
          title="Stock movements"
          description="Warehouse stock movements where this bin is the source or destination. Product filter narrows the trace."
        >
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Search stock movements"
                  value={stockSearch}
                  onChange={(event) => {
                    setStockSearch(event.target.value);
                    stockPage.reset();
                  }}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <EntityLookupField
                  label="Product filter"
                  entityType="products"
                  value={stockProduct}
                  onChange={(option) => {
                    setStockProduct(option);
                    stockPage.reset();
                  }}
                />
              </Grid>
            </Grid>
            <DataTable
              columns={stockMovementColumns}
              rows={stockMovementsQuery.data?.content ?? []}
              getRowId={(row) => row.id}
              loading={stockMovementsQuery.isLoading}
              error={stockMovementsQuery.isError}
              onRetry={() => stockMovementsQuery.refetch()}
              pagination={stockPage.pagination(stockMovementsQuery.data, stockMovementsQuery.isFetching)}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === "internal-movements" ? (
        <SectionCard
          title="Movement trace"
          description="Internal source/destination trace for this bin."
        >
          <Stack spacing={2}>
            <TextField
              label="Search product/SKU/bin/note"
              value={movementSearch}
              onChange={(event) => {
                setMovementSearch(event.target.value);
                movementPage.reset();
              }}
              size="small"
              fullWidth
            />
            <DataTable
              columns={movementColumns}
              rows={movementsQuery.data?.content ?? []}
              getRowId={(row) => row.id}
              loading={movementsQuery.isLoading}
              error={movementsQuery.isError}
              onRetry={() => movementsQuery.refetch()}
              pagination={movementPage.pagination(movementsQuery.data)}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === "change-history" ? (
        <ChangeHistoryPanel
          entityName="BIN_LOCATION"
          entityId={binId}
          title="Bin change history"
          description="Audit trail for bin location changes."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
