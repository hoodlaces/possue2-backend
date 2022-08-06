module.exports = ({ env }) => {
  return (
    {
      ckeditor: true,
    },
    {
      // ...
      slugify: {
        enabled: true,
        config: {
          contentTypes: {
            subject: {
              field: "slug",
              references: "title",
            },
          },
        },
      },
      // ...
    }
  );
};
