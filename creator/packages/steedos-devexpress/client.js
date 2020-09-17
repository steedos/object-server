"use strict";

/* Comment lines below for the widgets you don't require and run "devextreme-bundler" in this directory, then include dx.custom.js in your project */

/* Core (dx.module-core.js) */

var DevExpress = require("devextreme/bundles/modules/core");

/* Framework (dx.module-framework.js) */

DevExpress.framework = require("devextreme/bundles/modules/framework");

/* Integrations (dx.module-core.js) */

// require("devextreme/integration/jquery");


/* Events (dx.module-core.js) */

require("devextreme/events/click");
require("devextreme/events/contextmenu");
require("devextreme/events/double_click");
require("devextreme/events/drag");
require("devextreme/events/hold");
require("devextreme/events/hover");
require("devextreme/events/pointer");
require("devextreme/events/swipe");
require("devextreme/events/transform");


/* Data (dx.module-core.js) */

var data = DevExpress.data = require("devextreme/bundles/modules/data");

data.odata = require("devextreme/bundles/modules/data.odata");


/* UI core (dx.module-core.js) */

var ui = DevExpress.ui = require("devextreme/bundles/modules/ui");

// ui.themes = require("devextreme/ui/themes");

ui.setTemplateEngine = require("devextreme/ui/set_template_engine");

ui.dialog = require("devextreme/ui/dialog");
ui.notify = require("devextreme/ui/notify");

/* Base widgets (dx.module-widgets-base.js) */

// ui.dxActionSheet = require("devextreme/ui/action_sheet");
// ui.dxAutocomplete = require("devextreme/ui/autocomplete");
// ui.dxBox = require("devextreme/ui/box");
// ui.dxButton = require("devextreme/ui/button");
// ui.dxButtonGroup = require("devextreme/ui/button_group");
ui.dxCalendar = require("devextreme/ui/calendar");
// ui.dxCheckBox = require("devextreme/ui/check_box");
// ui.dxColorBox = require("devextreme/ui/color_box");
ui.dxDateBox = require("devextreme/ui/date_box");
// ui.dxDrawer = require("devextreme/ui/drawer");
// ui.dxDeferRendering = require("devextreme/ui/defer_rendering");
// ui.dxDropDownBox = require("devextreme/ui/drop_down_box");
// ui.dxDropDownMenu = require("devextreme/ui/drop_down_menu");
// ui.dxFileUploader = require("devextreme/ui/file_uploader");
// ui.dxForm = require("devextreme/ui/form");
// ui.dxGallery = require("devextreme/ui/gallery");
// ui.dxHtmlEditor = require("devextreme/ui/html_editor");
// ui.dxList = require("devextreme/ui/list");
// ui.dxLoadIndicator = require("devextreme/ui/load_indicator");
// ui.dxLoadPanel = require("devextreme/ui/load_panel");
// ui.dxLookup = require("devextreme/ui/lookup");
// ui.dxMap = require("devextreme/ui/map");
// ui.dxMultiView = require("devextreme/ui/multi_view");
// ui.dxNavBar = require("devextreme/ui/nav_bar");
// ui.dxNumberBox = require("devextreme/ui/number_box");
// 默认离不开overlay，是为了随时可以调用DevExpress.ui.dxOverlay.baseZIndex(2100);
ui.dxOverlay = require("devextreme/ui/overlay");
ui.dxPopover = require("devextreme/ui/popover");
// ui.dxPopup = require("devextreme/ui/popup");
// ui.dxProgressBar = require("devextreme/ui/progress_bar");
// ui.dxRadioGroup = require("devextreme/ui/radio_group");
// ui.dxRangeSlider = require("devextreme/ui/range_slider");
// ui.dxResizable = require("devextreme/ui/resizable");
// ui.dxResponsiveBox = require("devextreme/ui/responsive_box");
// ui.dxScrollView = require("devextreme/ui/scroll_view");
// ui.dxSelectBox = require("devextreme/ui/select_box");
// ui.dxSlider = require("devextreme/ui/slider");
// ui.dxSwitch = require("devextreme/ui/switch");
// ui.dxTabPanel = require("devextreme/ui/tab_panel");
// ui.dxTabs = require("devextreme/ui/tabs");
// ui.dxTagBox = require("devextreme/ui/tag_box");
// ui.dxTextArea = require("devextreme/ui/text_area");
// ui.dxTextBox = require("devextreme/ui/text_box");
// ui.dxTileView = require("devextreme/ui/tile_view");
// ui.dxToast = require("devextreme/ui/toast");
// ui.dxToolbar = require("devextreme/ui/toolbar");
// ui.dxTooltip = require("devextreme/ui/tooltip");
// ui.dxTrackBar = require("devextreme/ui/track_bar");

/* Validation (dx.module-widgets-base.js) */

// DevExpress.validationEngine = require("devextreme/ui/validation_engine");
// ui.dxValidationSummary = require("devextreme/ui/validation_summary");
// ui.dxValidationGroup = require("devextreme/ui/validation_group");
// ui.dxValidator = require("devextreme/ui/validator");

// /* Widget parts */
// require("devextreme/ui/html_editor/converters/markdown");


// /* Mobile widgets (dx.module-widgets-mobile.js) */

// ui.dxPanorama = require("devextreme/ui/panorama");
// ui.dxPivot = require("devextreme/ui/pivot");
// ui.dxSlideOut = require("devextreme/ui/slide_out");
// ui.dxSlideOutView = require("devextreme/ui/slide_out_view");


/* Web widgets (dx.module-widgets-web.js) */

// ui.dxAccordion = require("devextreme/ui/accordion");
// ui.dxContextMenu = require("devextreme/ui/context_menu");
ui.dxDataGrid = require("devextreme/ui/data_grid");
ui.dxTreeList = require("devextreme/ui/tree_list");
// ui.dxMenu = require("devextreme/ui/menu");
// ui.dxPivotGrid = require("devextreme/ui/pivot_grid");
// ui.dxPivotGridFieldChooser = require("devextreme/ui/pivot_grid_field_chooser");
// data.PivotGridDataSource = require("devextreme/ui/pivot_grid/data_source");
// data.XmlaStore = require("devextreme/ui/pivot_grid/xmla_store");
// ui.dxScheduler = require("devextreme/ui/scheduler");
ui.dxTreeView = require("devextreme/ui/tree_view");
// ui.dxFilterBuilder = require("devextreme/ui/filter_builder");


/* Viz core (dx.module-viz-core.js) */

var viz = DevExpress.viz = require("devextreme/bundles/modules/viz");
// viz.currentTheme = require("devextreme/viz/themes").currentTheme;
// viz.registerTheme = require("devextreme/viz/themes").registerTheme;
// viz.exportFromMarkup = require("devextreme/viz/export").exportFromMarkup;
// viz.getMarkup = require("devextreme/viz/export").getMarkup;
// viz.currentPalette = require("devextreme/viz/palette").currentPalette;
// viz.getPalette = require("devextreme/viz/palette").getPalette;
// viz.registerPalette = require("devextreme/viz/palette").registerPalette;
// viz.refreshTheme = require("devextreme/viz/themes").refreshTheme;

/* Charts (dx.module-viz-charts.js) */
// viz.dxChart = require("devextreme/viz/chart");
// viz.dxPieChart = require("devextreme/viz/pie_chart");
// viz.dxPolarChart = require("devextreme/viz/polar_chart");

// /* Gauges (dx.module-viz-gauges.js) */
// viz.dxLinearGauge = require("devextreme/viz/linear_gauge");
// viz.dxCircularGauge = require("devextreme/viz/circular_gauge");
// viz.dxBarGauge = require("devextreme/viz/bar_gauge");

// /* Range selector (dx.module-viz-rangeselector.js) */
// viz.dxRangeSelector = require("devextreme/viz/range_selector");

// /* Vector map (dx.module-viz-vectormap.js) */
// viz.dxVectorMap = require("devextreme/viz/vector_map");
// viz.map = {};
// viz.map.sources = {};
// viz.map.projection = require("devextreme/viz/vector_map/projection").projection;

// /* Sparklines (dx.module-viz-sparklines.js) */
// viz.dxSparkline = require("devextreme/viz/sparkline");
// viz.dxBullet = require("devextreme/viz/bullet");

// /* Treemap */
// viz.dxTreeMap = require("devextreme/viz/tree_map");

// /* Funnel */
// viz.dxFunnel = require("devextreme/viz/funnel");

// /* Sankey */
// viz.dxSankey = require("devextreme/viz/sankey");


/* Utilities for integration with ASP.NET */
/* DevExpress.aspnet = require("devextreme/aspnet"); */
require("devextreme/dist/js/localization/dx.messages.zh")