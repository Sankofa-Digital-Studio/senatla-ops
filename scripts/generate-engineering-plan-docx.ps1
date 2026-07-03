param(
  [string]$OutputPath = "output/doc/Senatla-Asset-Register-Engineering-Plan.docx"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root $OutputPath
$work = Join-Path $root 'tmp/docs/asset-register-ooxml'
$zip = [System.IO.Path]::ChangeExtension($output, '.zip')

if (Test-Path $work) { Remove-Item -LiteralPath $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $work,(Join-Path $work '_rels'),(Join-Path $work 'docProps'),(Join-Path $work 'word'),(Join-Path $work 'word/_rels'),(Join-Path $root 'output/doc') | Out-Null

function Escape-Xml([string]$value) { return [System.Security.SecurityElement]::Escape($value) }
function Paragraph([string]$text, [string]$style = 'Normal') {
  $safe = Escape-Xml $text
  return ('<w:p><w:pPr><w:pStyle w:val="{0}"/></w:pPr><w:r><w:t xml:space="preserve">{1}</w:t></w:r></w:p>' -f $style, $safe)
}
function Bullet([string]$text) {
  $safe = Escape-Xml $text
  return ('<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t>{0}</w:t></w:r></w:p>' -f $safe)
}
function Table([string[]]$headers, [object[]]$rows, [int[]]$widths) {
  $xml = '<w:tbl><w:tblPr><w:tblStyle w:val="SenatlaTable"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>'
  foreach ($width in $widths) { $xml += ('<w:gridCol w:w="{0}"/>' -f $width) }
  $xml += '</w:tblGrid><w:tr>'
  for ($i = 0; $i -lt $headers.Count; $i++) {
    $safe = Escape-Xml $headers[$i]
    $xml += ('<w:tc><w:tcPr><w:tcW w:w="{0}" w:type="dxa"/><w:shd w:fill="172B4D"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>{1}</w:t></w:r></w:p></w:tc>' -f $widths[$i], $safe)
  }
  $xml += '</w:tr>'
  foreach ($row in $rows) {
    $xml += '<w:tr>'
    for ($i = 0; $i -lt $headers.Count; $i++) {
      $safe = Escape-Xml ([string]$row[$i])
      $xml += ('<w:tc><w:tcPr><w:tcW w:w="{0}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{1}</w:t></w:r></w:p></w:tc>' -f $widths[$i], $safe)
    }
    $xml += '</w:tr>'
  }
  return $xml + '</w:tbl>'
}

$body = @()
$body += '<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Senatla Asset Register</w:t></w:r></w:p>'
$body += '<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t>Demo Readiness and Engineering Plan</w:t></w:r></w:p>'
$body += Paragraph 'Engineering Department and Parent Company Operations' 'Meta'
$body += Paragraph 'Prepared 21 June 2026' 'Meta'
$body += '<w:p><w:pPr><w:spacing w:before="1200"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="1463FF"/></w:rPr><w:t>Decision status</w:t></w:r><w:r><w:t>: High-level plan for validation; identifier integrity and local demo data are implemented.</w:t></w:r></w:p>'
$body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
$body += Paragraph 'Table of contents' 'Heading1'
$body += '<w:p><w:fldSimple w:instr="TOC \o &quot;1-3&quot; \h \z \u" w:dirty="true"><w:r><w:t>Open in Microsoft Word and update this field to generate the table of contents.</w:t></w:r></w:fldSimple></w:p>'
$body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

$body += Paragraph 'Executive summary' 'Heading1'
$body += Paragraph 'Senatla Ops can now demonstrate a shared asset register in which an asset is identified by at least one manufacturer serial number, VIN/chassis number, or number plate. Every identifier supplied is treated as unique. The demo includes engineering heavy machinery, a heavy vehicle and a parent-company light vehicle.'
$body += Paragraph 'Recommendation: build one multi-tenant asset platform with two controlled operating views, not two independent applications. A shared identity, audit, document and maintenance core avoids duplicate records and enables group reporting. Organization, business-unit and permission boundaries preserve operational separation.' 'Callout'

$body += Paragraph 'Three-pass review' 'Heading1'
$body += Paragraph 'Pass 1 - Baseline audit' 'Heading2'
$body += Paragraph 'The baseline had a dedicated asset route and persistent admin service, but captured only number plate and VIN. Serial number existed in the model and database but was not wired into either form. VIN was mandatory for non-road equipment and local demo mode opened empty.'
$body += Paragraph 'Pass 2 - Demo hardening' 'Heading2'
$body += Paragraph 'The screen now captures all three identifier types, asset class, status, compliance date, site and notes. Local mode seeds representative records. Service and database rules require at least one identifier and reject duplicate populated identifiers.'
$body += Paragraph 'Pass 3 - Critical comparison' 'Heading2'
$body += Paragraph 'The immediate demo gap is closed, but the register is not production-complete. Organization ownership, maintenance history, typed compliance, custody, evidence, meter readings and reliable UI regression tests remain the highest gaps.'

$body += Paragraph 'Prioritized loose links' 'Heading1'
$looseRows = @(
  @('P0','No organization/legal-owner field','Cannot safely separate or consolidate engineering and parent records.','Add organization, business unit, custodian and row-level policies before import.'),
  @('P0','Remote identifier migration not applied','App and database validation can disagree.','Back up, deduplicate, apply and verify the 20260621 migration.'),
  @('P0','Rendered browser QA blocked','Build passes; desktop/mobile interaction is unverified in this environment.','Restore approved browser tooling and run the demo script.'),
  @('P1','Maintenance is only a status','No work orders, triggers, downtime, costs or return-to-service control.','Build maintenance events, plans and work orders.'),
  @('P1','One generic compliance date','Licence, insurance, roadworthy and inspections cannot be governed separately.','Add typed compliance records, evidence and escalation.'),
  @('P1','No custody history','Assignments can change without accepted handover.','Add immutable custody and location events.'),
  @('P1','Duplicated asset forms','Office Admin and Asset Register have already drifted.','Extract a shared form and identity component.'),
  @('P1','Stale Angular standalone specs','Regression coverage is unreliable.','Modernize TestBed setup and add identity contract tests.'),
  @('P2','No migration/conflict workflow','Initial register creation will be slow and error-prone.','Add CSV dry run, match report and controlled merge.'),
  @('P2','No scan, evidence, meters or disposal','Field execution and lifecycle proof remain incomplete.','Stage QR lookup, private evidence, readings and retirement approvals.')
)
$body += Table @('Priority','Loose link','Impact','Required action') $looseRows @(850,2200,2900,3200)

$body += Paragraph 'Product scope' 'Heading1'
$body += Paragraph 'Shared asset identity' 'Heading2'
$body += Paragraph 'Use an internal immutable UUID as the database primary key. Treat serial number, VIN/chassis number and number plate as normalized alternate unique keys. Require at least one. Add an internal QR tag for fast lookup, never as a replacement for manufacturer or legal identifiers.'
$body += Paragraph 'Engineering register' 'Heading2'
$body += Bullet 'Heavy machinery, yellow metal, generators, compressors, trailers, pumps and attachments.'
$body += Bullet 'Parent-child asset relationships, hour meter, condition, site, custodian and criticality.'
$body += Bullet 'Pre-start inspections, defects, planned maintenance, certificates and downtime.'
$body += Paragraph 'Parent-company register' 'Heading2'
$body += Bullet 'Passenger vehicles, light commercial vehicles, trucks and small-medium equipment.'
$body += Bullet 'Odometer, licence, roadworthy, insurance, service and allocation.'
$body += Bullet 'Driver/custodian handover, incidents and fuel/telematics integration points.'

$body += Paragraph 'Recommended architecture' 'Heading1'
$architectureRows = @(
  @('Client','Ionic/Angular responsive web; Capacitor after offline workflows are proven.','One codebase for desktop, Android and iOS-sized screens.'),
  @('Identity','Supabase Auth with role and organization claims.','Central session and authorization boundary.'),
  @('Data','PostgreSQL/Supabase with organization-scoped row-level security.','Strong relational integrity for identifiers and lifecycle events.'),
  @('Files','Private object storage with signed URLs.','Controlled evidence and retention.'),
  @('Integration','Versioned APIs plus event/outbox records.','Decoupled finance, telematics and procurement integrations.'),
  @('Observability','Structured audit events and operational dashboards.','Attributable change and supportability.')
)
$body += Table @('Layer','Recommendation','Why') $architectureRows @(1200,4300,3650)
$body += Paragraph 'Core entities: Organization, Business Unit, Site, Asset, Asset Identifier, Asset Class, Custody Event, Meter Reading, Compliance Record, Inspection, Defect, Work Order, Maintenance Plan, Document, Supplier and Audit Event.'

$body += Paragraph 'Delivery roadmap' 'Heading1'
$body += Paragraph 'Phase 0 - Discovery and governance (1-2 weeks)' 'Heading2'
$body += Bullet 'Confirm legal owners, roles, source data, identifier rules, plate reuse, retention and POPIA duties.'
$body += Bullet 'Exit: signed data dictionary, role matrix, migration sample and workflow map.'
$body += Paragraph 'Phase 1 - Register foundation (3-4 weeks)' 'Heading2'
$body += Bullet 'Organization scope, row-level security, shared form, conflict service, audit, search, import/export and custody.'
$body += Bullet 'Exit: pilot register with traceable imports and no unresolved identifier collisions.'
$body += Paragraph 'Phase 2 - Compliance and maintenance (4-6 weeks)' 'Heading2'
$body += Bullet 'Typed compliance, evidence, inspections, defects, work orders, meters, schedules, downtime and dashboards.'
$body += Bullet 'Exit: teams manage the asset lifecycle without parallel spreadsheets.'
$body += Paragraph 'Phase 3 - Field mobility and integrations (3-5 weeks)' 'Heading2'
$body += Bullet 'QR lookup, photos, intermittent connectivity, notifications and integration adapters.'
$body += Bullet 'Exit: measured field adoption, reliable sync and supportable integrations.'

$body += Paragraph 'Product viability comparison' 'Heading1'
$body += Paragraph 'Live vendor verification was blocked by the network environment on 21 June 2026. This is a directional comparison and must be refreshed from official documentation and pricing during discovery.' 'Callout'
$comparisonRows = @(
  @('Fleetio','Vehicle records, odometers, service, fuel and driver workflows.','Fleet lifecycle and exception dashboards.','One register spanning parent vehicles and engineering machinery.'),
  @('Fiix','Asset hierarchy, preventive maintenance and work orders.','Maintenance plans, history and parts links.','Simpler field flow tied to Senatla sites and accountability.'),
  @('MaintainX','Mobile inspections, procedures and work execution.','Fast scan-to-task and evidence capture.','Low-friction workflows for mixed connectivity and governance.'),
  @('UpKeep','Mobile asset records, work orders and reporting.','Mobile-first maintenance and notifications.','Group identity integrity and South African operating context.')
)
$body += Table @('Reference','Strength to validate','Reuse as pattern','Senatla differentiation') $comparisonRows @(1400,2750,2500,2500)
$body += Paragraph 'Viable position: not another generic CMMS, but a Senatla operations spine connecting trusted asset identity to sites, accountability, compliance evidence and field execution.'
$body += Bullet 'Fleetio: https://www.fleetio.com/features/vehicle-management'
$body += Bullet 'Fiix: https://www.fiixsoftware.com/maintenance-software/asset-management/'
$body += Bullet 'MaintainX: https://www.getmaintainx.com/features/asset-management'
$body += Bullet 'UpKeep: https://upkeep.com/product/asset-management/'

$body += Paragraph 'Demo script' 'Heading1'
$body += Bullet 'Sign in with the office demo shortcut and open Asset Register.'
$body += Bullet 'Show the serial-only excavator, plate plus VIN truck and parent-company light vehicle.'
$body += Bullet 'Search CAT-320 and confirm only the excavator remains.'
$body += Bullet 'Confirm no-identifier and duplicate-identifier saves are blocked.'
$body += Bullet 'Add and edit a serial-only record assigned to Engineering Workshop.'
$body += Bullet 'Repeat at approximately 390 px width and verify no clipping or horizontal scrolling.'

$body += Paragraph 'Production pilot definition of done' 'Heading1'
$body += Bullet 'Every asset has an owner organization and at least one validated external identifier.'
$body += Bullet 'Zero unresolved serial, VIN or plate conflicts.'
$body += Bullet 'Row-level tests prove cross-organization isolation.'
$body += Bullet 'Every mutation creates an attributable audit event.'
$body += Bullet 'Compliance and maintenance triggers are deterministic and tested.'
$body += Bullet 'Desktop and current Android/iOS-sized flows pass.'
$body += Bullet 'Backup/restore rehearsal meets agreed RPO and RTO.'

$documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + ($body -join '') + '<w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>'

$contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'
$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'
$documentRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>'
$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="132033"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:pPr><w:spacing w:before="1800" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:color w:val="172B4D"/><w:sz w:val="50"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="500"/></w:pPr><w:rPr><w:color w:val="1463FF"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="596579"/><w:sz w:val="19"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="420" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:color w:val="172B4D"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1463FF"/><w:sz w:val="25"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360" w:right="240"/><w:spacing w:before="180" w:after="220"/><w:shd w:fill="EEF4FF"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="1463FF"/></w:pBdr></w:pPr></w:style><w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="360" w:hanging="180"/></w:pPr></w:style><w:style w:type="table" w:styleId="SenatlaTable"><w:name w:val="Senatla Table"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DCE2EA"/><w:left w:val="single" w:sz="4" w:color="DCE2EA"/><w:bottom w:val="single" w:sz="4" w:color="DCE2EA"/><w:right w:val="single" w:sz="4" w:color="DCE2EA"/><w:insideH w:val="single" w:sz="4" w:color="DCE2EA"/><w:insideV w:val="single" w:sz="4" w:color="DCE2EA"/></w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>'
$settings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="true"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>'
$header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="1463FF"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="172B4D"/><w:sz w:val="18"/></w:rPr><w:t>SENATLA OPS  |  ASSET REGISTER ENGINEERING PLAN</w:t></w:r></w:p></w:hdr>'
$footer = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="596579"/><w:sz w:val="18"/></w:rPr><w:t>21 June 2026  |  Page </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="596579"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>'
$core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Senatla Asset Register - Demo Readiness and Engineering Plan</dc:title><dc:subject>Engineering and parent company asset register</dc:subject><dc:creator>Senatla Engineering</dc:creator><cp:lastModifiedBy>Senatla Engineering</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-21T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-21T00:00:00Z</dcterms:modified></cp:coreProperties>'
$app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>Senatla</Company><AppVersion>16.0000</AppVersion></Properties>'

$utf8 = New-Object System.Text.UTF8Encoding($false)
$files = @{
  '[Content_Types].xml' = $contentTypes; '_rels/.rels' = $rels; 'docProps/core.xml' = $core; 'docProps/app.xml' = $app;
  'word/document.xml' = $documentXml; 'word/styles.xml' = $styles; 'word/settings.xml' = $settings;
  'word/header1.xml' = $header; 'word/footer1.xml' = $footer; 'word/_rels/document.xml.rels' = $documentRels
}
foreach ($entry in $files.GetEnumerator()) {
  $path = Join-Path $work $entry.Key
  [System.IO.File]::WriteAllText($path, $entry.Value, $utf8)
}
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($source in Get-ChildItem -LiteralPath $work -Recurse -File) {
    $relative = $source.FullName.Substring($work.Length + 1).Replace('\', '/')
    $entry = $archive.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $sourceStream = [System.IO.File]::OpenRead($source.FullName)
    try { $sourceStream.CopyTo($entryStream) } finally { $sourceStream.Dispose(); $entryStream.Dispose() }
  }
} finally {
  $archive.Dispose()
}
Move-Item -LiteralPath $zip -Destination $output
Remove-Item -LiteralPath $work -Recurse -Force
Write-Output $output
