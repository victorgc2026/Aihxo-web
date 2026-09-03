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

window.mostrarNuevaCamiseta = async function () {

  const proveedor =
    prompt("Proveedor (ejemplo: Roly, Makito, etc.):");

  if (proveedor === null) return;

  const modelo =
    prompt("Modelo del proveedor:");

  if (modelo === null) return;

  const color =
    prompt("Color de la camiseta:");

  if (!color) return;

  const talla =
    prompt("Talla:");

  if (!talla) return;

  const publico =
    prompt(
      "Tipo: Niño, Adulto o Unisex:",
      "Unisex"
    ) || "Unisex";

  const cantidadTexto =
    prompt("Cantidad inicial:", "0");

  if (cantidadTexto === null) return;

  const cantidad = Number(cantidadTexto);

  if (!Number.isInteger(cantidad) || cantidad < 0) {
    alert("La cantidad no es válida.");
    return;
  }

  const minimoTexto =
    prompt("Avisar cuando queden cuántas unidades:", "3");

  if (minimoTexto === null) return;

  const minimo = Number(minimoTexto);

  if (!Number.isInteger(minimo) || minimo < 0) {
    alert("El stock mínimo no es válido.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("base_stock_items")
    .insert({
      garment_type: "Camiseta",
      supplier: proveedor.trim(),
      supplier_model: modelo.trim(),
      audience: publico.trim(),
      color: color.trim(),
      size: talla.trim(),
      quantity: cantidad,
      min_stock: minimo
    })
    .select()
    .single();

  if (error) {

    if (error.code === "23505") {
      alert(
        "Esa combinación de proveedor, modelo, color y talla ya existe."
      );
    } else {
      console.error(error);
      alert("No se pudo crear la camiseta.");
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

  await cargarFiltrosCamisetas();
  await cargarStockCamisetas();
};


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
