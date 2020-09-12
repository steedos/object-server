
function ListContainer(prop){
	const { List, Bootstrap, store } = ReactSteedos;
	const Provider = ReactRedux.Provider;
	if(!prop.listProps){
		return null;
	}
	return (
		<Provider store={store}>
			<Bootstrap>
				<List id={prop.id} {...prop.listProps}/>
			</Bootstrap>
		</Provider>
	)
}

export default ListContainer;