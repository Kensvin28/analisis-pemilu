<svelte:head>
    <title>About</title>
    <meta name="description" content="About this website" />
</svelte:head>

<main class="container">
    <section>
        <h1>About This Website</h1>
        <p>
            This website provides insights related to the 2014 and 2019 Indonesian presidential election results.
        </p>
        <br/>
        <p>
            The information in this website is obtained from the data extracted by Kawal Pemilu in
            <a href="https://github.com/kawalpemilu/kawalpemilu2014/blob/master/extract/clean.csv">2014</a> and
            <a href="https://github.com/kawalpemilu/kawalpemilu2019-extract/tree/master/c">2019</a> (KPU field), which covers around
            <strong>98%</strong> of all valid domestic votes. Please note that the data taken from Kawal Pemilu is incomplete, thus the visualizations may not reflect the complete and final results published by KPU.
        </p>
        <br/>
        <p>
            The city/regency borders displayed follow the 2014 administrative borders. Votes in new administrative regions in 2019 that were not present in 2014 are combined to their parent regions that exist in 2014.
        </p>
        <br/>
        <p>
            This website is created using <a href="https://svelte.dev/">Svelte</a>. The data is processed using <a href="https://www.python.org/">Python</a> and <a href="https://qgis.org/">QGIS</a>, and the maps are rendered using <a href="https://maplibre.org/">MapLibre GL JS</a>.
        </p>
    </section>
</main>

<style>
    .container {
        margin: 0 auto;
    }

    section {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
</style>
