<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/brainlife-mark-on-dark.svg">
    <img src=".github/brand/brainlife-mark-on-light.svg" alt="brainlife.io" width="140">
  </picture>
</p>

<h1 align="center">warehouse (legacy)</h1>

<p align="center">
  The original brainlife.io warehouse: projects, datasets, Apps, rules and publications.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-lightgrey.svg" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/Status-legacy-lightgrey.svg" alt="Status: legacy">
  <a href="https://brainlife.io"><img src="https://img.shields.io/badge/brainlife.io-site-3b9fd0.svg" alt="brainlife.io"></a>
  <a href="https://brainlife.io/docs"><img src="https://img.shields.io/badge/Docs-brainlife.io%2Fdocs-005981.svg" alt="Documentation"></a>
  <a href="https://doi.org/10.1038/s41592-024-02237-2"><img src="https://img.shields.io/badge/DOI-10.1038%2Fs41592--024--02237--2-e57536.svg" alt="Nature Methods paper"></a>
</p>

> [!WARNING]
> **Legacy.** Development of the warehouse moved to [brainlife/warehouse-next](https://github.com/brainlife/warehouse-next) in 2024; this repository has had one commit in 2026 (a LICENSE update). The [brainlife](https://github.com/brainlife/brainlife) development stack still references this repository.

## 🧠 At a glance

| | |
|---|---|
| 🧭 **What** | REST API, Vue web UI and background handlers (event handler, pipeline rules) for brainlife.io projects, datasets, datatypes, Apps and publications |
| 🧱 **Stack** | Node.js · Express · MongoDB · AMQP · Vue (`ui/`) |
| 📖 **API docs** | [brainlife.github.io/warehouse/apidoc](https://brainlife.github.io/warehouse/apidoc/) |
| ➡️ **Use instead** | [warehouse-next](https://github.com/brainlife/warehouse-next) |
| 🕰️ **Last activity** | 2026-08-10 (LICENSE); last code change 2025-08 |

## 🚀 Running it

```bash
npm install
cp api/config/index.js.dev api/config/index.js   # edit
node api/warehouse.js
```

For a full local stack (auth, event, amaretti, warehouse, MongoDB, RabbitMQ) see [brainlife/brainlife](https://github.com/brainlife/brainlife).

<details>
<summary><b>🏗️ Architecture diagram</b></summary>

![brainlife.io architecture](https://docs.google.com/drawings/d/e/2PACX-1vSbxpvxhckYT5rUJReexZdbaL4xZpMDiebDP-yQAxrcy1VwKCAHYQQTWE8mMQ4lBgQg9qpcZcZmaEr1/pub?w=960&amp;h=551)

</details>

## 🙏 Sponsorship

We gratefully acknowledge the support of the AWS Open Data Program for providing S3 storage resources to brainlife.io.

## 👥 Authors

Soichi Hayashi (author). Contributors: Franco Pestilli.

## 📚 Citing

If you use brainlife.io in your work, please cite:

> Hayashi S, Caron BA, Heinsfeld AS, et al. brainlife.io: a decentralized and open-source cloud platform to support neuroscience research. *Nature Methods* 21:809–813 (2024). [doi:10.1038/s41592-024-02237-2](https://doi.org/10.1038/s41592-024-02237-2)

## 💰 Funding

brainlife.io is developed by the Pestilli Lab at The University of Texas at Austin and is publicly funded; acknowledging that support helps keep it running.

<details>
<summary>Grants (verified list, from <a href="https://github.com/brainlife/ezbids/blob/master/CREDITS.md#funding">ezbids CREDITS.md</a>)</summary>

| Funder | Award | Title |
|---|---|---|
| NIH NINDS | [U24NS140384](https://reporter.nih.gov/project-details/U24NS140384) | BRAIN CONNECTS: The Axonal Projectome EXchange (APEX) |
| NIH NIMH | [R01MH126699](https://reporter.nih.gov/project-details/R01MH126699) | Community-driven development of BIDS |
| NIH NIBIB | [R01EB030896](https://reporter.nih.gov/project-details/R01EB030896) | CRCNS US-France: open science and cloud computing of MEEG |
| NIH NIBIB | [R01EB029272](https://reporter.nih.gov/project-details/R01EB029272) | CRCNS US-France: lowering the barrier of entry to network neuroscience |
| NSF | [BCS-1636893](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1636893), [2148729](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2148729) | BD Spokes: Advanced Computational Neuroscience Network |
| NSF | [BCS-1734853](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1734853), [2203524](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2203524) | NCS-FO: Connectome mapping algorithms |
| NSF | [IIS-1912270](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1912270), [2148700](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2148700) | CRCNS US-German: DataLad |
| NSF | [ACI-1916518](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1916518) | BD Hubs: Midwest Big Data Hub |
| Wellcome Trust | [226486](https://grantnav.threesixtygiving.org/grant/360G-Wellcome-226486_Z_22_Z) | Developing an international governance framework to advance global brain and mental health data equity and innovation |

</details>

## 🤝 Contributing

Issues and pull requests are welcome in this repository. For help using brainlife.io, see the [documentation](https://brainlife.io/docs).

## ⚖️ License

[MIT](LICENSE).

<p align="center"><sub>brainlife.io · Brain data across scales. One place to analyze, share and publish it. · The University of Texas at Austin</sub></p>
