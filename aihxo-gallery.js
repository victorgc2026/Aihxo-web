(function () {

  async function productGallery(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    const { data: images, error } = await supabaseClient
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('is_primary', { ascending: false })
      .order('sort_order');

    if (error) {
      toast(error.message);
      return;
    }

    openDrawer(`
      <h2>Fotos · ${esc(p.model)}</h2>

      <div style="margin-bottom:15px">
        <button class="primary"
          onclick="aihxoPhotoInput('${id}')">
          📷 Añadir foto
        </button>
      </div>

      ${
        images && images.length
        ? `
          <div style="
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:12px">

            ${images.map(img => `
              <div class="card" style="padding:8px">

                <img
                  src="${esc(img.public_url)}"
                  style="
                    width:100%;
                    aspect-ratio:1;
                    object-fit:cover;
                    border-radius:10px">

                <div style="margin-top:8px">
                  ${
                    img.is_primary
                    ? `<span class="green">⭐ Principal</span>`
                    : `
                      <button
                        class="secondary"
                        onclick="
                          setPrimaryProductImage(
                            '${img.id}',
                            '${id}'
                          )">
                        ⭐ Principal
                      </button>
                    `
                  }
                </div>

                <button
                  class="secondary"
                  style="width:100%;margin-top:8px"
                  onclick="
                    deleteProductImage(
                      '${img.id}',
                      '${id}'
                    )">
                  🗑️ Eliminar
                </button>

              </div>
            `).join('')}

          </div>
        `
        : `<div class="empty">
             Este producto no tiene fotografías.
           </div>`
      }
    `);
  }

  async function setPrimaryProductImage(imageId, productId) {

    const { data: images, error } =
      await supabaseClient
        .from('product_images')
        .select('id')
        .eq('product_id', productId);

    if (error) {
      toast(error.message);
      return;
    }

    for (const image of images) {
      await supabaseClient
        .from('product_images')
        .update({
          is_primary: image.id === imageId
        })
        .eq('id', image.id);
    }

    toast('Foto principal actualizada');

    productGallery(productId);
  }

  async function deleteProductImage(imageId, productId) {

    if (!confirm('¿Eliminar esta fotografía?')) return;

    const { data: img, error } =
      await supabaseClient
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

    if (error) {
      toast(error.message);
      return;
    }

    await supabaseClient
      .storage
      .from('product-images')
      .remove([img.storage_path]);

    const result =
      await supabaseClient
        .from('product_images')
        .delete()
        .eq('id', imageId);

    if (result.error) {
      toast(result.error.message);
      return;
    }

    toast('Fotografía eliminada');

    productGallery(productId);
  }

  window.productGallery = productGallery;
  window.setPrimaryProductImage = setPrimaryProductImage;
  window.deleteProductImage = deleteProductImage;

})();
