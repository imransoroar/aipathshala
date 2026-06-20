/* Shared render helpers used across pages. */
function stars(rating){
  const r=Math.round(rating||0);
  return '★★★★★'.slice(0,r)+'☆☆☆☆☆'.slice(0,5-r);
}
function levelLabel(l){ return t('level_'+(l||'beginner'))||l; }

function courseCard(c){
  const price=c.discountPrice && c.discountPrice<c.price
    ? `${money(c.discountPrice,c.currency)} <span class="old">${money(c.price)}</span>`
    : money(c.price,c.currency);
  const badge=c.featured
    ? `<span class="course-badge featured">★ ${t('featured')}</span>`
    : `<span class="course-badge">${levelLabel(c.level)}</span>`;
  const thumb=c.thumbnail
    ? `<img src="${c.thumbnail}" alt="" loading="lazy" onerror="this.style.display='none'">` : '';
  return `
  <a class="course-card reveal" href="/course.html?slug=${c.slug}">
    <div class="course-thumb">${thumb}${badge}</div>
    <div class="course-body">
      <span class="course-cat">${c.category||''}</span>
      <h3 class="course-title">${L(c,'title')}</h3>
      <p class="muted" style="font-size:.86rem;margin:0;line-height:1.5">${L(c,'summary').slice(0,82)}</p>
      <div class="course-meta">
        <span>📚 ${c.lessonCount||0} ${t('lessons')}</span>
        <span>👥 ${(c.studentCount||0).toLocaleString(getLang()==='bn'?'bn-BD':'en-US')}</span>
        ${c.rating?`<span class="stars">${stars(c.rating)} ${c.rating}</span>`:''}
      </div>
    </div>
    <div class="course-foot">
      <span class="price">${price}</span>
      <span class="btn btn-primary btn-sm">${t('go_to_course')} →</span>
    </div>
  </a>`;
}

// Skeleton placeholder cards while loading
function skeletonCards(n){
  let s='';
  for(let i=0;i<(n||6);i++) s+=`
    <div class="sk-card">
      <div class="sk-img shimmer"></div>
      <div class="sk-line shimmer" style="width:40%"></div>
      <div class="sk-line shimmer"></div>
      <div class="sk-line shimmer short"></div>
      <div class="sk-line shimmer" style="margin-top:22px"></div>
    </div>`;
  return `<div class="skeleton-grid">${s}</div>`;
}

window.courseCard=courseCard;
window.skeletonCards=skeletonCards;
window.stars=stars;
window.levelLabel=levelLabel;
