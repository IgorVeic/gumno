<?php
/**
 * Fill the Sitemap menu in the admin with every public Gumno page.
 *
 * Usage (from project root):
 *   php themes/gumno/scripts/seed_sitemap.php
 */

declare(strict_types=1);

use Cms\Classes\PageManager;
use Cms\Models\PageLookupItem;
use Tailor\Models\EntryRecord;

define('GUMNO_SEED_ROOT', dirname(__DIR__, 3));

require GUMNO_SEED_ROOT . '/bootstrap/autoload.php';
$app = require GUMNO_SEED_ROOT . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/**
 * @return array<int, array{title: string, page: string, priority: string, changefreq: string, slug?: string}>
 */
function gumnoSitemapItems(): array
{
    $items = [
        ['title' => 'Гумно Охрид', 'page' => 'home', 'priority' => '1.0', 'changefreq' => 'weekly'],
        ['title' => 'Производи', 'page' => 'katalog/index', 'priority' => '0.9', 'changefreq' => 'weekly'],
        ['title' => 'PVC цевки', 'page' => 'katalog/pvc-cevki', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['title' => 'Санитарија', 'page' => 'katalog/sanitarija', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['title' => 'Батерии', 'page' => 'katalog/baterii', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['title' => 'Плочки', 'page' => 'katalog/plocki', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['title' => 'Производство', 'page' => 'proizvodstvo/index', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['title' => 'Фитинг за канализација', 'page' => 'proizvodstvo/fiting-za-kanalizacija', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['title' => 'Капаци за шоља', 'page' => 'proizvodstvo/kapaci-za-sholja', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['title' => 'Малопродажба', 'page' => 'maloprodazba/index', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['title' => 'Продажен салон 1', 'page' => 'maloprodazba/prodazen-salon', 'slug' => 'prodazen-salon-1', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['title' => 'Продажен салон 2', 'page' => 'maloprodazba/prodazen-salon', 'slug' => 'prodazen-salon2', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['title' => 'Продажен салон 3', 'page' => 'maloprodazba/prodazen-salon', 'slug' => 'prodazen-salon3', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ['title' => 'Брендови', 'page' => 'brendovi/index', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['title' => 'DIANFLEX', 'page' => 'brendovi/brend', 'slug' => 'dianflex', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'CIMOS TITAN', 'page' => 'brendovi/brend', 'slug' => 'cimos-titan', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'KOMAK', 'page' => 'brendovi/brend', 'slug' => 'komak', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'HP Trend', 'page' => 'brendovi/brend', 'slug' => 'hp-trend', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'MARBOMIL', 'page' => 'brendovi/brend', 'slug' => 'marbomil', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'CERSANIT', 'page' => 'brendovi/brend', 'slug' => 'cersanit', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'EUROSER', 'page' => 'brendovi/brend', 'slug' => 'euroser', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'IZOTERM', 'page' => 'brendovi/brend', 'slug' => 'izoterm', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'ZENNER', 'page' => 'brendovi/brend', 'slug' => 'zenner', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'IVANIĆPLAST', 'page' => 'brendovi/brend', 'slug' => 'ivanicplast', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['title' => 'За нас', 'page' => 'za-nas', 'priority' => '0.6', 'changefreq' => 'yearly'],
        ['title' => 'Контакт', 'page' => 'kontakt', 'priority' => '0.6', 'changefreq' => 'yearly'],
    ];

    $path = themes_path('gumno/assets/data/products.json');
    $products = is_file($path) ? (json_decode((string) file_get_contents($path), true) ?: []) : [];
    foreach ($products as $product) {
        $slug = (string) ($product['slug'] ?? '');
        $title = trim((string) ($product['title'] ?? ''));
        if ($slug === '' || $title === '') {
            continue;
        }
        $items[] = [
            'title' => $title,
            'page' => 'katalog/proizvod',
            'slug' => $slug,
            'priority' => '0.5',
            'changefreq' => 'monthly',
        ];
    }

    return $items;
}

function gumnoSitemapReference(array $item): string
{
    $params = ['title' => $item['title'] . ' (' . $item['page'] . ')'];
    if (!empty($item['slug'])) {
        $params['slug'] = $item['slug'];
    }

    return PageLookupItem::encodeSchema('cms-page', $item['page'], $params);
}

$items = gumnoSitemapItems();
$menus = EntryRecord::inSection('Site\\Menus')
    ->where('content_group', 'sitemap_menu')
    ->where('slug', 'sitemap')
    ->orderBy('id')
    ->get();

if ($menus->isEmpty()) {
    fwrite(STDERR, "No sitemap menu found. Create a Sitemap menu with code \"sitemap\" in the admin first.\n");
    exit(1);
}

$failed = [];

foreach ($menus as $menu) {
    $menu->sitemap_items()->delete();
    $sort = 1;
    foreach ($items as $item) {
        $reference = gumnoSitemapReference($item);
        $resolved = PageManager::resolve($reference);
        $url = (string) ($resolved->url ?? '');
        if ($url === '' || str_contains($url, ':slug')) {
            $failed[] = $item['title'] . ' -> ' . $url;
        }

        $row = $menu->sitemap_items()->make([
            'title' => $item['title'],
            'reference' => $reference,
            'priority' => $item['priority'],
            'changefreq' => $item['changefreq'],
            'nesting' => '0',
            'replace' => '0',
            'is_hidden' => '0',
            'is_external' => '0',
            'code' => 'sitemap-' . $sort,
            'css_class' => '',
        ]);
        $row->site_id = $menu->site_id;
        $row->sort_order = $sort;
        $row->save();
        $sort++;
    }
    echo $menu->title . " ({$menu->id}): " . ($sort - 1) . " items\n";
}

if ($failed) {
    fwrite(STDERR, "Unresolved URLs:\n" . implode("\n", $failed) . "\n");
    exit(1);
}

echo "Sitemap items saved.\n";
