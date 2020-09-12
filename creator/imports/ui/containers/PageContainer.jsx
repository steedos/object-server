
function PageContainer(prop){
	const { store, Bootstrap } = ReactSteedos;
	const Provider = ReactRedux.Provider;
	const pageId = prop.pageId;
	if (!pageId || !Creator.Pages[pageId])
		return null;
	const Page = Creator.Pages[pageId]	
	return (
		<Provider store={store}>
			<Bootstrap>
				<Page/>
			</Bootstrap>
		</Provider>
	);
}

export default PageContainer;