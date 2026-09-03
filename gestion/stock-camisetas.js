/* =========================================================
   AIHXO · STOCK DE CAMISETAS BASE
   ========================================================= */

window.renderStockCamisetas = async function () {

  const app = document.getElementById("view");

  app.innerHTML = `
    <div style="padding:16px;max-width:1100px;margin:auto">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin-bottom:18px;
        flex-wrap:wrap;
      ">
        <div>
          <h2 style="margin:0">👕 Stock de camisetas</h2>
          <div style="opacity:.7;margin-top:4px">
            Inventario de prendas base
          </div>
        </div>

        <button onclick="mostrarNuevaCamiseta()">
          ＋ Nueva camiseta
        </button>
      </div>

      <div id="resumenStockCamisetas"
           style="
             display:grid;
             grid-template-columns:repeat(3,1fr);
             gap:8px;
             margin-bottom:15px;
           ">
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-bottom:15px;
      ">
        <select id="filtroColorCamisetas"
                onchange="cargarStockCamisetas()">
          <option value="">Todos los colores</option>
        </select>

        <select id="filtroTallaCamisetas"
                onchange="cargarStockCamisetas()">
          <option value="">Todas las tallas</option>
        </select>
      </div>

      <div id="listaStockCamisetas">
        Cargando stock...
      </div>

      <div style="margin-top:20px">
        <button onclick="home()">← Volver</button>
      </div>

    </div>
  `;

  await cargarFiltrosCamisetas();
  await cargarStockCamisetas();
};


/* =========================================================
   CARGAR STOCK
   ========================================================= */

window.cargarStockCamisetas = async function () {

  const contenedor = document.getElementById("listaStockCamisetas");
  if (!contenedor) return;

  const color =
    document.getElementById("filtroColorCamisetas")?.value || "";

  const talla =
    document.getElementById("filtroTallaCamisetas")?.value || "";

  let consulta = supabaseClient
    .from("base_stock_items")
    .select("*")
    .order("color")
    .order("size");

  if (color) consulta = consulta.eq("color", color);
  if (talla) consulta = consulta.eq("size", talla);

  const { data, error } = await consulta;

  if (error) {
    console.error(error);
    contenedor.innerHTML =
      `<div style="padding:15px">Error cargando el stock.</div>`;
    return;
  }

  const items = data || [];

  pintarResumenCamisetas(items);

  if (!items.length) {
    contenedor.innerHTML = `
      <div style="
        padding:30px 15px;
        text-align:center;
        opacity:.7;
        border:1px solid rgba(255,255,255,.12);
        border-radius:14px;
      ">
        Todavía no hay camisetas registradas.<br><br>
        Pulsa <b>＋ Nueva camiseta</b>.
      </div>
    `;
    return;
  }

  contenedor.innerHTML = items.map(item => {

    const stock = Number(item.quantity || 0);
    const minimo = Number(item.min_stock ?? 3);

    let estado = "🟢";
    let textoEstado = "Stock correcto";

    if (stock === 0) {
      estado = "🔴";
      textoEstado = "Sin stock";
    } else if (stock <= minimo) {
      estado = "🟠";
      textoEstado = "Stock bajo";
    }

    return `
      <div style="
        border:1px solid rgba(255,255,255,.12);
        border-radius:16px;
        padding:14px;
        margin-bottom:10px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:flex-start;
        ">

          <div>
            <div style="font-weight:800;font-size:17px">
              ${escapeStock(item.garment_type || "Camiseta")}
              · ${escapeStock(item.color)}
              · ${escapeStock(item.size)}
            </div>

            <div style="opacity:.7;margin-top:4px">
              ${escapeStock(item.supplier || "Sin proveedor")}
              ${item.supplier_model
                ? " · " + escapeStock(item.supplier_model)
                : ""}
            </div>

            <div style="opacity:.7;margin-top:3px">
              ${escapeStock(item.audience || "Unisex")}
            </div>
          </div>

          <div style="text-align:right">
            <div style="font-size:27px;font-weight:900">
              ${estado} ${stock}
            </div>

            <div style="font-size:12px;opacity:.7">
              ${textoEstado}
            </div>
          </div>

        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr 1fr;
          gap:7px;
          margin-top:14px;
        ">

          <button onclick="movimientoCamiseta(
            '${item.id}',
            'entrada',
            ${stock}
          )">
            ＋ Entrada
          </button>

          <button onclick="movimientoCamiseta(
            '${item.id}',
            'salida',
            ${stock}
          )">
            − Salida
          </button>

          <button onclick="ajustarCamiseta(
            '${item.id}',
            ${stock}
          )">
            Ajustar
          </button>

        </div>

      </div>
    `;
  }).join("");
};


/* =========================================================
   RESUMEN
   ========================================================= */

window.pintarResumenCamisetas = function (items) {

  const el = document.getElementById("resumenStockCamisetas");
  if (!el) return;

  const total =
    items.reduce((s, x) => s + Number(x.quantity || 0), 0);

  const sinStock =
    items.filter(x => Number(x.quantity || 0) === 0).length;

  const bajo =
    items.filter(x =>
      Number(x.quantity || 0) > 0 &&
      Number(x.quantity || 0) <= Number(x.min_stock ?? 3)
    ).length;

  el.innerHTML = `
    ${tarjetaResumenStock("Unidades", total)}
    ${tarjetaResumenStock("Stock bajo", bajo)}
    ${tarjetaResumenStock("Agotadas", sinStock)}
  `;
};


function tarjetaResumenStock(titulo, numero) {
  return `
    <div style="
      border:1px solid rgba(255,255,255,.12);
      border-radius:13px;
      padding:11px 8px;
      text-align:center;
    ">
      <div style="font-size:22px;font-weight:900">
        ${numero}
      </div>
      <div style="font-size:11px;opacity:.7">
        ${titulo}
      </div>
    </div>
  `;
}


/* =========================================================
   NUEVA CAMISETA
   ========================================================= */

window.mostrarNuevaCamiseta = function () {

  const drawer = document.getElementById("drawer");
  const body = document.getElementById("drawerBody");

  if (!drawer || !body) {
    alert("No se pudo abrir el formulario.");
    return;
  }

  drawer.classList.remove("hidden");

  body.innerHTML = `
    <h2>👕 Nueva camiseta base</h2>

    <div class="muted" style="margin-bottom:18px">
      Añade una referencia de stock por modelo, color y talla.
    </div>

    <form id="formNuevaCamiseta" class="form">

      <div class="field">
        <label>Proveedor</label>
        <input
          name="supplier"
          placeholder="Ej. Mukua"
          required
        >
      </div>

      <div class="field">
        <label>Modelo del proveedor</label>
        <input
          name="supplier_model"
          placeholder="Ej. Melbourne Kids"
          required
        >
      </div>

      <div class="field">
        <label>Tipo de prenda</label>
        <select name="garment_type">
          <option value="Camiseta">Camiseta</option>
          <option value="Sudadera">Sudadera</option>
          <option value="Polo">Polo</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div class="field">
        <label>Público</label>
        <select name="audience">
          <option value="Niño">Niño</option>
          <option value="Adulto">Adulto</option>
          <option value="Unisex">Unisex</option>
        </select>
      </div>

      <div class="formgrid">

        <div class="field">
          <label>Color</label>
          <input
            name="color"
            placeholder="Ej. Blanca"
            required
          >
        </div>

        <div class="field">
          <label>Talla</label>
          <input
            name="size"
            placeholder="Ej. 5/6"
            required
          >
        </div>

      </div>

      <div class="formgrid">

        <div class="field">
          <label>Stock inicial</label>
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            value="0"
            required
          >
        </div>

        <div class="field">
          <label>Stock mínimo</label>
          <input
            name="min_stock"
            type="number"
            min="0"
            step="1"
            value="3"
            required
          >
        </div>

      </div>

      <div class="field">
        <label>Coste unitario €</label>
        <input
          name="unit_cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="Ej. 3.50"
          value="0"
        >
      </div>

      <div class="field">
        <label>Notas</label>
        <textarea
          name="notes"
          rows="3"
          placeholder="Referencia, detalles del proveedor, etc."
        ></textarea>
      </div>

      <button class="primary" type="submit">
        Guardar camiseta
      </button>

      <button
        class="secondary"
        type="button"
        onclick="closeDrawer()"
      >
        Cancelar
      </button>

    </form>
  `;

  document.getElementById("formNuevaCamiseta").onsubmit =
    guardarNuevaCamiseta;
};


async function guardarNuevaCamiseta(e) {

  e.preventDefault();

  const form = new FormData(e.target);

  const cantidad = Number(form.get("quantity"));
  const minimo = Number(form.get("min_stock"));
  const coste = Number(form.get("unit_cost") || 0);

  if (!Number.isInteger(cantidad) || cantidad < 0) {
    alert("El stock inicial no es válido.");
    return;
  }

  if (!Number.isInteger(minimo) || minimo < 0) {
    alert("El stock mínimo no es válido.");
    return;
  }

  if (coste < 0) {
    alert("El coste no es válido.");
    return;
  }

  const nueva = {
    garment_type: form.get("garment_type").trim(),
    supplier: form.get("supplier").trim(),
    supplier_model: form.get("supplier_model").trim(),
    audience: form.get("audience").trim(),
    color: form.get("color").trim(),
    size: form.get("size").trim(),
    quantity: cantidad,
    min_stock: minimo,
    unit_cost: coste,
    notes: form.get("notes").trim()
  };

  const { data, error } = await supabaseClient
    .from("base_stock_items")
    .insert(nueva)
    .select()
    .single();

  if (error) {

    if (error.code === "23505") {
      alert(
        "Esa combinación de proveedor, modelo, color y talla ya existe."
      );
    } else {
      console.error(error);
      alert("No se pudo guardar la camiseta.");
    }

    return;
  }

  if (cantidad > 0) {
    await guardarMovimientoCamiseta(
      data.id,
      "entrada",
      cantidad,
      0,
      cantidad,
      "Stock inicial"
    );
  }

  closeDrawer();

  await cargarFiltrosCamisetas();
  await cargarStockCamisetas();

  toast("Camiseta añadida");
}

/* =========================================================
   ENTRADAS Y SALIDAS
   ========================================================= */

window.movimientoCamiseta = async function (
  id,
  tipo,
  stockActual
) {

  const texto = prompt(
    tipo === "entrada"
      ? "¿Cuántas camisetas entran?"
      : "¿Cuántas camisetas salen?"
  );

  if (texto === null) return;

  const cantidad = Number(texto);

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    alert("Introduce una cantidad válida.");
    return;
  }

  let nuevoStock;

  if (tipo === "entrada") {
    nuevoStock = stockActual + cantidad;
  } else {
    nuevoStock = stockActual - cantidad;
  }

  if (nuevoStock < 0) {
    alert("No hay suficientes camisetas en stock.");
    return;
  }

  const motivo =
    prompt(
      tipo === "entrada"
        ? "Motivo / compra (opcional):"
        : "Motivo de salida (opcional):",
      tipo === "entrada"
        ? "Compra a proveedor"
        : "Uso en pedido"
    ) || "";

  const { error } = await supabaseClient
    .from("base_stock_items")
    .update({
      quantity: nuevoStock,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
    return;
  }

  await guardarMovimientoCamiseta(
    id,
    tipo,
    tipo === "entrada" ? cantidad : -cantidad,
    stockActual,
    nuevoStock,
    motivo
  );

  await cargarStockCamisetas();
};


/* =========================================================
   AJUSTE MANUAL
   ========================================================= */

window.ajustarCamiseta = async function (
  id,
  stockActual
) {

  const texto = prompt(
    "Stock real contado:",
    String(stockActual)
  );

  if (texto === null) return;

  const nuevoStock = Number(texto);

  if (!Number.isInteger(nuevoStock) || nuevoStock < 0) {
    alert("Introduce un stock válido.");
    return;
  }

  if (nuevoStock === stockActual) return;

  const motivo =
    prompt(
      "Motivo del ajuste:",
      "Recuento manual"
    ) || "Recuento manual";

  const { error } = await supabaseClient
    .from("base_stock_items")
    .update({
      quantity: nuevoStock,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("No se pudo ajustar el stock.");
    return;
  }

  await guardarMovimientoCamiseta(
    id,
    "ajuste",
    nuevoStock - stockActual,
    stockActual,
    nuevoStock,
    motivo
  );

  await cargarStockCamisetas();
};


/* =========================================================
   HISTORIAL
   ========================================================= */

async function guardarMovimientoCamiseta(
  itemId,
  tipo,
  diferencia,
  anterior,
  nuevo,
  motivo
) {

  const { error } = await supabaseClient
    .from("base_stock_movements")
    .insert({
      item_id: itemId,
      movement_type: tipo,
      quantity_delta: diferencia,
      previous_quantity: anterior,
      new_quantity: nuevo,
      reason: motivo || ""
    });

  if (error) {
    console.error(
      "Error guardando movimiento de stock:",
      error
    );
  }
}


/* =========================================================
   FILTROS
   ========================================================= */

window.cargarFiltrosCamisetas = async function () {

  const { data, error } = await supabaseClient
    .from("base_stock_items")
    .select("color,size");

  if (error) return;

  const colores = [
    ...new Set(
      (data || []).map(x => x.color).filter(Boolean)
    )
  ].sort();

  const tallas = [
    ...new Set(
      (data || []).map(x => x.size).filter(Boolean)
    )
  ];

  const filtroColor =
    document.getElementById("filtroColorCamisetas");

  const filtroTalla =
    document.getElementById("filtroTallaCamisetas");

  if (filtroColor) {
    filtroColor.innerHTML =
      `<option value="">Todos los colores</option>` +
      colores.map(x =>
        `<option value="${escapeStock(x)}">
          ${escapeStock(x)}
        </option>`
      ).join("");
  }

  if (filtroTalla) {
    filtroTalla.innerHTML =
      `<option value="">Todas las tallas</option>` +
      tallas.map(x =>
        `<option value="${escapeStock(x)}">
          ${escapeStock(x)}
        </option>`
      ).join("");
  }
};


/* =========================================================
   SEGURIDAD TEXTO
   ========================================================= */

function escapeStock(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
