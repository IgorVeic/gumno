<?php
/**
 * Seed 301 redirects from the original WordPress site into Vdlp.Redirect.
 *
 * Usage (from project root):
 *   php themes/gumno/scripts/seed_wp_redirects.php
 */

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Vdlp\Redirect\Classes\PublishManager;
use Vdlp\Redirect\Models\Category;
use Vdlp\Redirect\Models\Redirect;

define('GUMNO_SEED_ROOT', dirname(__DIR__, 3));

require GUMNO_SEED_ROOT . '/bootstrap/autoload.php';
$app = require GUMNO_SEED_ROOT . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function gumnoNormalizePath(string $path): string
{
    $path = rawurldecode(trim($path));
    if ($path === '') {
        return '/';
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    return rtrim($path, '/') ?: '/';
}

function gumnoAddRedirect(array &$bucket, string $from, string $to, string $description): void
{
    $from = gumnoNormalizePath($from);
    $to = gumnoNormalizePath($to);
    if ($from === $to) {
        return;
    }
    $bucket[$from] = [
        'from' => $from,
        'to' => $to,
        'description' => $description,
    ];
}

$bucket = [];

// Page aliases that changed between WordPress and October.
$pageAliases = [
    '/производи' => '/proizvodi',
    '/брендови' => '/brendovi',
    '/нови-производи' => '/proizvodi',
    '/sample-page' => '/',
    '/doma' => '/',
    '/intro' => '/',
];
foreach ($pageAliases as $from => $to) {
    gumnoAddRedirect($bucket, $from, $to, 'WP page alias');
}

// WordPress category archives.
$categoryAliases = [
    '/category/distribucija-gumno' => '/brendovi',
    '/category/distribucija-gumno/marbomil' => '/brendovi/marbomil',
    '/category/distribucija-gumno/hp-trend' => '/brendovi/hp-trend',
    '/category/distribucija-gumno/cimos-titan' => '/brendovi/cimos-titan',
    '/category/distribucija-gumno/komak' => '/brendovi/komak',
    '/category/distribucija-gumno/cerasanit' => '/brendovi/cersanit',
    '/category/distribucija-gumno/cersanit' => '/brendovi/cersanit',
    '/category/distribucija-gumno/dianflex' => '/brendovi/dianflex',
    '/category/distribucija-gumno/izoterm' => '/brendovi/izoterm',
    '/category/distribucija-gumno/euroser' => '/brendovi/euroser',
    '/category/distribucija-gumno/zenner' => '/brendovi/zenner',
    '/category/distribucija-gumno/ivanicplast' => '/brendovi/ivanicplast',
    '/category/gumno-proizvodi' => '/proizvodi',
    '/category/gumno-proizvodi/fiting-kanalizacija' => '/proizvodstvo/fiting-za-kanalizacija',
    '/category/uncategorized' => '/proizvodi',
];
foreach ($categoryAliases as $from => $to) {
    gumnoAddRedirect($bucket, $from, $to, 'WP category archive');
}

// Common WordPress system paths.
$systemAliases = [
    '/wp-admin' => '/',
    '/feed' => '/',
    '/comments/feed' => '/',
    '/home' => '/',
];
foreach ($systemAliases as $from => $to) {
    gumnoAddRedirect($bucket, $from, $to, 'WP system path');
}

// Product posts: /{slug} -> /proizvod/{slug}
$productsPath = GUMNO_SEED_ROOT . '/themes/gumno/assets/data/products.json';
$products = is_file($productsPath)
    ? (json_decode((string) file_get_contents($productsPath), true) ?: [])
    : [];

$slugLookup = [];
foreach ($products as $product) {
    $slug = rawurldecode((string) ($product['slug'] ?? ''));
    if ($slug === '') {
        continue;
    }
    $slugLookup[$slug] = $slug;
    gumnoAddRedirect(
        $bucket,
        '/' . $slug,
        '/proizvod/' . $slug,
        'WP product post'
    );
    $legacy = rawurldecode((string) ($product['legacy_slug'] ?? ''));
    if ($legacy !== '' && $legacy !== $slug) {
        $slugLookup[$legacy] = $slug;
        gumnoAddRedirect(
            $bucket,
            '/' . $legacy,
            '/proizvod/' . $slug,
            'WP product post'
        );
    }
}

// Also include WP link paths in case slug encoding differs.
$postsPath = GUMNO_SEED_ROOT . '/wp-posts-all.json';
if (is_file($postsPath)) {
    $posts = json_decode((string) file_get_contents($postsPath), true) ?: [];
    foreach ($posts as $post) {
        $link = (string) ($post['link'] ?? '');
        if ($link === '') {
            continue;
        }
        $path = parse_url($link, PHP_URL_PATH) ?: '';
        $slug = gumnoNormalizePath($path);
        if ($slug === '/' || str_starts_with($slug, '/category/') || str_starts_with($slug, '/proizvod/')) {
            continue;
        }
        $leaf = rawurldecode(ltrim($slug, '/'));
        $target = '/proizvod/' . ($slugLookup[$leaf] ?? $leaf);
        gumnoAddRedirect($bucket, $slug, $target, 'WP product link');
    }
}

$category = Category::query()->where('name', 'WordPress migration')->first();
if (!$category) {
    $category = new Category();
    $category->forceFill(['name' => 'WordPress migration']);
    $category->save();
}

// Replace previous migration redirects so the script is re-runnable.
DB::table('vdlp_redirect_redirects')
    ->where(function ($query) use ($category) {
        $query->where('category_id', $category->id)
            ->orWhere('description', 'like', 'WP %');
    })
    ->delete();

$sort = 1;
$created = 0;

DB::transaction(function () use ($bucket, $category, &$sort, &$created) {
    foreach ($bucket as $row) {
        $redirect = Redirect::make([
            'category_id' => $category->id,
            'match_type' => Redirect::TYPE_EXACT,
            'target_type' => Redirect::TARGET_TYPE_PATH_URL,
            'from_scheme' => Redirect::SCHEME_AUTO,
            'from_url' => $row['from'],
            'to_scheme' => Redirect::SCHEME_AUTO,
            'to_url' => $row['to'],
            'status_code' => 301,
            'ignore_query_parameters' => true,
            'ignore_case' => true,
            'ignore_trailing_slash' => true,
            'keep_querystring' => false,
            'is_enabled' => true,
            'test_lab' => false,
            'system' => true,
            'description' => $row['description'],
            'sort_order' => $sort++,
        ]);
        $redirect->save();
        $created++;
    }
});

/** @var PublishManager $publisher */
$publisher = resolve(PublishManager::class);
$published = $publisher->publish();

echo "Created {$created} WordPress redirects.\n";
echo "Published {$published} enabled redirects to rules file/cache.\n";
