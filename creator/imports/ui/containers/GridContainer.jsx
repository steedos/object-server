
var iconPath = `/assets/icons`;
var gridObjectName = 'space_users';
var gridColumns = [
	{
		field: 'name',
		label: '姓名',
		hidden: false,
		onClick: function () {
			console.log(111);
		},
		renderCell: function () { }
	},
	{
		field: 'mobile',
		label: '手机号',

	},
	{
		field: 'email',
		label: '邮件地址',

	},
	{
		field: 'modified_by',
		label: '修改人',
		type: 'lookup'
	},
	{
		field: 'modified',
		label: '修改时间',
		type: 'datetime'
	},
];

function GridContainer(){
	const { Grid, store } = ReactSteedos;
	const Provider = ReactRedux.Provider;
	return 
			<Provider store={store}>
				<Grid objectName={gridObjectName} columns={gridColumns} selectRows='checkbox' enableSearch={true}></Grid>
			</Provider>
		
}

export default GridContainer;